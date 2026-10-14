
class QueryClient {
    constructor(defaultOptions = {}) {
        this.cache = new Map();
        this.subscribers = new Map();
        this.inFlightRequests = new Map();
        this.controllers = new Map();
        this.requestIds = new Map();
        this.queryOptions = new Map();
        this.gcTimers = new Map();

        this.defaultOptions = {
            staleTime: 30_000,
            cacheTime: 300_000,
            retry: 2,
            retryDelay: 500,
            ...defaultOptions,
        };
    }

    getKey(queryKey) {
        return JSON.stringify(queryKey);
    }

    getQueryStateFromKey(key) {
        return (
            this.cache.get(key) || {
                data: undefined,
                loading: false,
                error: null,
                cancelled: false,
                stale: true,
                updatedAt: 0,
            }
        );
    }

    getQueryData(queryKey) {
        return this.getQueryStateFromKey(this.getKey(queryKey)).data;
    }

    getQueryState(queryKey) {
        return this.getQueryStateFromKey(this.getKey(queryKey));
    }

    notifyByKey(key) {
        const listeners = this.subscribers.get(key);

        if (!listeners) return;

        const state = this.getQueryStateFromKey(key);

        listeners.forEach((listener) => listener(state));
    }

    subscribe(queryKey, listener) {
        const key = this.getKey(queryKey);

        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }

        this.subscribers.get(key).add(listener);

        const timer = this.gcTimers.get(key);

        if (timer) {
            clearTimeout(timer);
            this.gcTimers.delete(key);
        }

        listener(this.getQueryStateFromKey(key));

        return () => {
            const listeners = this.subscribers.get(key);

            if (!listeners) return;

            listeners.delete(listener);

            if (listeners.size === 0) {
                this.subscribers.delete(key);
                this.cancelQueryByKey(key);
                this.scheduleGarbageCollection(key);
            }
        };
    }

    scheduleGarbageCollection(key) {
        const options =
            this.queryOptions.get(key) || this.defaultOptions;

        const cacheTime = options.cacheTime;

        if (cacheTime === Infinity || cacheTime < 0) return;

        const existingTimer = this.gcTimers.get(key);

        if (existingTimer) clearTimeout(existingTimer);

        const timer = setTimeout(() => {
            if (this.subscribers.has(key)) return;

            this.removeQueryByKey(key);
        }, cacheTime);

        this.gcTimers.set(key, timer);
    }

    cancelQueryByKey(key) {
        const controller = this.controllers.get(key);
        const hadRequest = this.inFlightRequests.has(key);

        this.requestIds.set(
            key,
            (this.requestIds.get(key) || 0) + 1
        );

        if (controller) {
            controller.abort();
        }

        this.controllers.delete(key);
        this.inFlightRequests.delete(key);

        if (hadRequest) {
            const previous = this.getQueryStateFromKey(key);

            this.cache.set(key, {
                ...previous,
                loading: false,
                error: null,
                cancelled: true,
            });

            this.notifyByKey(key);
        }
    }

    cancelQuery(queryKey) {
        this.cancelQueryByKey(this.getKey(queryKey));
    }

    setQueryData(queryKey, updater) {
        const key = this.getKey(queryKey);

        this.cancelQueryByKey(key);

        const previous = this.getQueryStateFromKey(key);

        const nextData =
            typeof updater === "function"
                ? updater(previous.data)
                : updater;

        const nextState = {
            ...previous,
            data: nextData,
            loading: false,
            error: null,
            cancelled: false,
            stale: false,
            updatedAt: Date.now(),
        };

        this.cache.set(key, nextState);
        this.notifyByKey(key);

        this.scheduleGarbageCollection(key);

        return nextData;
    }

    async fetchQuery(
        queryKey,
        queryFunction,
        args = [],
        options = {}
    ) {
        const key = this.getKey(queryKey);

        const settings = {
            ...this.defaultOptions,
            ...options,
        };

        this.queryOptions.set(key, settings);

        const previous = this.getQueryStateFromKey(key);

        const isFresh =
            previous.data !== undefined &&
            !previous.stale &&
            Date.now() - previous.updatedAt < settings.staleTime;

        if (!settings.force && isFresh) {
            return previous.data;
        }

        if (
            !settings.force &&
            this.inFlightRequests.has(key)
        ) {
            return this.inFlightRequests.get(key);
        }

        if (settings.force) {
            this.cancelQueryByKey(key);
        }

        const controller = new AbortController();

        this.controllers.set(key, controller);

        const requestId =
            (this.requestIds.get(key) || 0) + 1;

        this.requestIds.set(key, requestId);

        const isCurrentRequest = () =>
            this.requestIds.get(key) === requestId &&
            !controller.signal.aborted;

        this.cache.set(key, {
            ...this.getQueryStateFromKey(key),
            loading: true,
            error: null,
            cancelled: false,
            stale: true,
        });

        this.notifyByKey(key);

        const waitForRetry = (delay) =>
            new Promise((resolve, reject) => {
                if (controller.signal.aborted) {
                    reject(
                        new DOMException(
                            "درخواست لغو شد",
                            "AbortError"
                        )
                    );
                    return;
                }

                let timer;

                const cleanup = () => {
                    clearTimeout(timer);
                    controller.signal.removeEventListener(
                        "abort",
                        onAbort
                    );
                };

                const onAbort = () => {
                    cleanup();

                    reject(
                        new DOMException(
                            "درخواست لغو شد",
                            "AbortError"
                        )
                    );
                };

                timer = setTimeout(() => {
                    cleanup();
                    resolve();
                }, delay);

                controller.signal.addEventListener(
                    "abort",
                    onAbort,
                    { once: true }
                );
            });

        const promise = (async () => {
            let attempt = 0;

            try {
                while (true) {
                    try {
                        const data = await queryFunction(
                            controller.signal,
                            ...args
                        );

                        if (!isCurrentRequest()) {
                            return data;
                        }

                        this.cache.set(key, {
                            data,
                            loading: false,
                            error: null,
                            cancelled: false,
                            stale: false,
                            updatedAt: Date.now(),
                        });

                        this.notifyByKey(key);
                        this.scheduleGarbageCollection(key);

                        return data;
                    } catch (error) {
                        if (
                            controller.signal.aborted ||
                            error.name === "AbortError"
                        ) {
                            if (isCurrentRequest()) {
                                this.cache.set(key, {
                                    ...this.getQueryStateFromKey(key),
                                    loading: false,
                                    error: null,
                                    cancelled: true,
                                });

                                this.notifyByKey(key);
                            }

                            throw error;
                        }

                        if (attempt < settings.retry) {
                            attempt += 1;

                            await waitForRetry(
                                settings.retryDelay * attempt
                            );

                            continue;
                        }

                        if (isCurrentRequest()) {
                            this.cache.set(key, {
                                ...this.getQueryStateFromKey(key),
                                loading: false,
                                error,
                                cancelled: false,
                                stale: true,
                            });

                            this.notifyByKey(key);
                        }

                        throw error;
                    }
                }
            } finally {
                if (this.requestIds.get(key) === requestId) {
                    this.inFlightRequests.delete(key);
                    this.controllers.delete(key);
                }
            }
        })();

        this.inFlightRequests.set(key, promise);

        return promise;
    }

    refetchQuery(queryKey) {
        const key = this.getKey(queryKey);
        const settings = this.queryOptions.get(key);

        if (!settings?.queryFunction) {
            return Promise.reject(
                new Error("تابع این Query ثبت نشده است.")
            );
        }

        return this.fetchQuery(
            queryKey,
            settings.queryFunction,
            settings.args || [],
            {
                ...settings,
                force: true,
            }
        );
    }

    async invalidateQuery(queryKey) {
        const key = this.getKey(queryKey);

        this.cancelQueryByKey(key);

        const previous = this.getQueryStateFromKey(key);

        this.cache.set(key, {
            ...previous,
            stale: true,
            loading: false,
            cancelled: false,
        });

        this.notifyByKey(key);

        const settings = this.queryOptions.get(key);

        if (
            this.subscribers.has(key) &&
            settings?.queryFunction
        ) {
            return this.fetchQuery(
                queryKey,
                settings.queryFunction,
                settings.args || [],
                {
                    ...settings,
                    force: true,
                }
            );
        }
    }

    removeQueryByKey(key) {
        this.cancelQueryByKey(key);

        const timer = this.gcTimers.get(key);

        if (timer) clearTimeout(timer);

        this.gcTimers.delete(key);
        this.cache.delete(key);
        this.queryOptions.delete(key);
        this.inFlightRequests.delete(key);
        this.controllers.delete(key);
        this.requestIds.delete(key);
    }

    removeQuery(queryKey) {
        this.removeQueryByKey(this.getKey(queryKey));
    }

    clear() {
        for (const key of this.cache.keys()) {
            this.removeQueryByKey(key);
        }

        for (const timer of this.gcTimers.values()) {
            clearTimeout(timer);
        }

        this.cache.clear();
        this.subscribers.clear();
        this.inFlightRequests.clear();
        this.controllers.clear();
        this.requestIds.clear();
        this.queryOptions.clear();
        this.gcTimers.clear();
    }
}

export default QueryClient;
