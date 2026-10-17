// src/query/QueryClient.js

function serializeQueryKey(queryKey) {
    return JSON.stringify(queryKey);
}

function createInitialState(queryKey, options = {}) {
    return {
        queryKey,
        data: undefined,
        error: null,
        status: "idle",
        loading: false,
        fetching: false,
        updatedAt: 0,
        staleTime: options.staleTime ?? 0,
        cacheTime: options.cacheTime ?? 300_000,
        observers: new Set(),
        promise: null,
        abortController: null,
        gcTimeout: null,
        invalidated: false,
        queryFn: null,
        options: { ...options },
        requestId: 0,
    };
}

export default class QueryClient {
    constructor(defaultOptions = {}) {
        this.queries = new Map();

        this.defaultOptions = {
            staleTime: 0,
            cacheTime: 300_000,
            retry: 0,
            retryDelay: 500,
            ...defaultOptions,
        };

        this.destroyed = false;
    }

    getQueryKey(queryKey) {
        return serializeQueryKey(queryKey);
    }

    getQueryState(queryKey) {
        const query = this.queries.get(
            this.getQueryKey(queryKey)
        );

        if (!query) {
            return undefined;
        }

        return {
            queryKey: query.queryKey,
            data: query.data,
            error: query.error,
            status: query.status,
            loading: query.loading,
            fetching: query.fetching,
            updatedAt: query.updatedAt,
            staleTime: query.staleTime,
            cacheTime: query.cacheTime,
            invalidated: query.invalidated,
            observersCount: query.observers.size,
        };
    }

    getQueryData(queryKey) {
        return this.getQueryState(queryKey)?.data;
    }

    ensureQuery(queryKey, options = {}) {
        if (this.destroyed) {
            throw new Error(
                "QueryClient پس از destroy قابل استفاده نیست."
            );
        }

        const key = this.getQueryKey(queryKey);
        let query = this.queries.get(key);

        if (!query) {
            query = createInitialState(queryKey, {
                ...this.defaultOptions,
                ...options,
            });

            this.queries.set(key, query);
        } else {
            query.options = {
                ...query.options,
                ...options,
            };

            query.staleTime =
                options.staleTime ??
                query.staleTime ??
                this.defaultOptions.staleTime;

            query.cacheTime =
                options.cacheTime ??
                query.cacheTime ??
                this.defaultOptions.cacheTime;
        }

        return query;
    }

    notify(query) {
        for (const listener of [...query.observers]) {
            try {
                listener(this.getQueryState(query.queryKey));
            } catch (error) {
                console.error(
                    "QueryClient observer error:",
                    error
                );
            }
        }
    }

    subscribe(queryKey, listener) {
        const query = this.ensureQuery(queryKey);

        if (typeof listener !== "function") {
            throw new TypeError(
                "Query listener باید تابع باشد."
            );
        }

        this.clearGarbageCollection(query);

        query.observers.add(listener);

        return () => {
            query.observers.delete(listener);

            if (query.observers.size === 0) {
                if (query.fetching) {
                    this.cancelQuery(query.queryKey);
                }

                this.scheduleGarbageCollection(query);
            }
        };
    }

    clearGarbageCollection(query) {
        if (query.gcTimeout !== null) {
            clearTimeout(query.gcTimeout);
            query.gcTimeout = null;
        }
    }

    scheduleGarbageCollection(query) {
        this.clearGarbageCollection(query);

        if (query.observers.size > 0) {
            return;
        }

        if (query.fetching || query.promise) {
            return;
        }

        const cacheTime = query.cacheTime;

        if (!Number.isFinite(cacheTime) || cacheTime < 0) {
            return;
        }

        if (cacheTime === 0) {
            this.removeQueryIfUnused(query.queryKey);
            return;
        }

        const key = this.getQueryKey(query.queryKey);
        const expectedQuery = query;

        query.gcTimeout = setTimeout(() => {
            const currentQuery = this.queries.get(key);

            if (
                currentQuery !== expectedQuery ||
                currentQuery.observers.size > 0 ||
                currentQuery.fetching ||
                currentQuery.promise
            ) {
                return;
            }

            this.queries.delete(key);
            query.gcTimeout = null;
        }, cacheTime);
    }

    removeQueryIfUnused(queryKey) {
        const key = this.getQueryKey(queryKey);
        const query = this.queries.get(key);

        if (!query) {
            return false;
        }

        if (
            query.observers.size > 0 ||
            query.fetching ||
            query.promise
        ) {
            return false;
        }

        this.clearGarbageCollection(query);
        this.queries.delete(key);

        return true;
    }

    isStale(query) {
        if (!query || query.data === undefined) {
            return true;
        }

        if (query.invalidated) {
            return true;
        }

        if (query.staleTime === Infinity) {
            return false;
        }

        return (
            Date.now() - query.updatedAt >=
            query.staleTime
        );
    }

    async fetchQuery(
        queryKey,
        queryFn,
        options = {}
    ) {
        const query = this.ensureQuery(
            queryKey,
            options
        );

        if (typeof queryFn !== "function") {
            throw new TypeError(
                "queryFn باید تابع باشد."
            );
        }

        query.queryFn = queryFn;
        query.options = {
            ...query.options,
            ...options,
        };

        if (
            options.force !== true &&
            !this.isStale(query) &&
            query.data !== undefined
        ) {
            return query.data;
        }

        if (query.promise) {
            return query.promise;
        }

        this.clearGarbageCollection(query);

        const requestId = ++query.requestId;
        const controller = new AbortController();

        query.abortController = controller;
        query.fetching = true;
        query.loading = query.data === undefined;
        query.status =
            query.data === undefined
                ? "loading"
                : "success";
        query.error = null;

        this.notify(query);

        const retry = Math.max(
            0,
            Number(
                options.retry ??
                this.defaultOptions.retry
            )
        );

        const retryDelay =
            options.retryDelay ??
            this.defaultOptions.retryDelay;

        const execute = async () => {
            let attempt = 0;

            while (true) {
                if (controller.signal.aborted) {
                    throw new DOMException(
                        "درخواست لغو شد.",
                        "AbortError"
                    );
                }

                try {
                    return await queryFn({
                        signal: controller.signal,
                    });
                } catch (error) {
                    if (
                        controller.signal.aborted ||
                        error?.name === "AbortError" ||
                        attempt >= retry
                    ) {
                        throw error;
                    }

                    attempt += 1;

                    const delay =
                        typeof retryDelay === "function"
                            ? retryDelay(attempt, error)
                            : retryDelay;

                    await new Promise((resolve, reject) => {
                        if (controller.signal.aborted) {
                            reject(
                                new DOMException(
                                    "درخواست لغو شد.",
                                    "AbortError"
                                )
                            );
                            return;
                        }

                        const timeoutId = setTimeout(() => {
                            controller.signal.removeEventListener(
                                "abort",
                                handleAbort
                            );
                            resolve();
                        }, Math.max(0, Number(delay) || 0));

                        function handleAbort() {
                            clearTimeout(timeoutId);
                            controller.signal.removeEventListener(
                                "abort",
                                handleAbort
                            );

                            reject(
                                new DOMException(
                                    "درخواست لغو شد.",
                                    "AbortError"
                                )
                            );
                        }

                        controller.signal.addEventListener(
                            "abort",
                            handleAbort,
                            { once: true }
                        );
                    });
                }
            }
        };

        const requestPromise = execute();
        query.promise = requestPromise;

        try {
            const data = await requestPromise;

            if (
                this.queries.get(
                    this.getQueryKey(queryKey)
                ) !== query ||
                query.requestId !== requestId
            ) {
                return data;
            }

            query.data = data;
            query.error = null;
            query.status = "success";
            query.loading = false;
            query.fetching = false;
            query.updatedAt = Date.now();
            query.invalidated = false;

            return data;
        } catch (error) {
            if (
                this.queries.get(
                    this.getQueryKey(queryKey)
                ) !== query ||
                query.requestId !== requestId
            ) {
                throw error;
            }

            query.error = error;
            query.status =
                error?.name === "AbortError"
                    ? query.data === undefined
                        ? "idle"
                        : "success"
                    : "error";

            query.loading = false;
            query.fetching = false;

            throw error;
        } finally {
            if (query.requestId === requestId) {
                query.promise = null;
                query.abortController = null;
                query.fetching = false;
                query.loading = false;

                this.notify(query);

                if (query.observers.size === 0) {
                    this.scheduleGarbageCollection(query);
                }
            }
        }
    }

    async fetchInfiniteQuery(
        queryKey,
        queryFn,
        pageParam,
        options = {}
    ) {
        const query = this.ensureQuery(queryKey, options);

        const currentData =
            query.data &&
                Array.isArray(query.data.pages) &&
                Array.isArray(query.data.pageParams)
                ? query.data
                : {
                    pages: [],
                    pageParams: [],
                };

        const pageIndex = currentData.pageParams.findIndex(
            (param) => JSON.stringify(param) === JSON.stringify(pageParam)
        );

        if (pageIndex !== -1 && options.force !== true) {
            return currentData;
        }

        const page = await this.fetchQuery(
            queryKey,
            async ({ signal }) => {
                const result = await queryFn(signal, pageParam);

                const latestData =
                    query.data &&
                        Array.isArray(query.data.pages) &&
                        Array.isArray(query.data.pageParams)
                        ? query.data
                        : {
                            pages: [],
                            pageParams: [],
                        };

                const existingIndex = latestData.pageParams.findIndex(
                    (param) =>
                        JSON.stringify(param) === JSON.stringify(pageParam)
                );

                const pages = [...latestData.pages];
                const pageParams = [...latestData.pageParams];

                if (existingIndex === -1) {
                    pages.push(result);
                    pageParams.push(pageParam);
                } else {
                    pages[existingIndex] = result;
                }

                return { pages, pageParams };
            },
            {
                ...options,
                force: true,
            }
        );

        return page;
    }

    cancelInfiniteQuery(queryKey) {
        return this.cancelQuery(queryKey);
    }

    async refetchQuery(queryKey, options = {}) {
        const query = this.queries.get(
            this.getQueryKey(queryKey)
        );

        if (!query?.queryFn) {
            throw new Error(
                "برای این Query تابع درخواست ثبت نشده است."
            );
        }

        return this.fetchQuery(
            queryKey,
            query.queryFn,
            {
                ...query.options,
                ...options,
                force: true,
            }
        );
    }

    setQueryData(queryKey, updater) {
        const query = this.ensureQuery(queryKey);

        this.clearGarbageCollection(query);

        const nextData =
            typeof updater === "function"
                ? updater(query.data)
                : updater;

        query.data = nextData;
        query.error = null;
        query.status = "success";
        query.loading = false;
        query.updatedAt = Date.now();
        query.invalidated = false;

        this.notify(query);

        if (query.observers.size === 0) {
            this.scheduleGarbageCollection(query);
        }

        return nextData;
    }

    async invalidateQuery(queryKey) {
        const query = this.queries.get(
            this.getQueryKey(queryKey)
        );

        if (!query) {
            return;
        }

        query.invalidated = true;
        this.notify(query);

        if (query.observers.size > 0 && query.queryFn) {
            return this.refetchQuery(queryKey);
        }
    }

    cancelQuery(queryKey) {
        const query = this.queries.get(
            this.getQueryKey(queryKey)
        );

        if (!query) {
            return false;
        }

        query.requestId += 1;

        if (query.abortController) {
            query.abortController.abort();
        }

        query.abortController = null;
        query.promise = null;
        query.fetching = false;
        query.loading = false;

        if (query.data === undefined) {
            query.status = "idle";
        }

        this.notify(query);

        if (query.observers.size === 0) {
            this.scheduleGarbageCollection(query);
        }

        return true;
    }

    cancelQueries() {
        for (const query of this.queries.values()) {
            this.cancelQuery(query.queryKey);
        }
    }

    removeQuery(queryKey) {
        const key = this.getQueryKey(queryKey);
        const query = this.queries.get(key);

        if (!query) {
            return false;
        }

        // Query فعال حذف نمی‌شود؛ ابتدا درخواست لغو می‌شود.
        this.cancelQuery(queryKey);

        if (query.observers.size > 0) {
            query.data = undefined;
            query.error = null;
            query.status = "idle";
            query.loading = false;
            query.fetching = false;
            query.updatedAt = 0;
            query.invalidated = false;

            this.notify(query);
            return false;
        }

        this.clearGarbageCollection(query);
        this.queries.delete(key);

        return true;
    }

    clear() {
        this.cancelQueries();

        for (const query of this.queries.values()) {
            this.clearGarbageCollection(query);
        }

        this.queries.clear();
    }

    getQueryCount() {
        return this.queries.size;
    }

    getQueriesState() {
        return Array.from(
            this.queries.values(),
            (query) => this.getQueryState(query.queryKey)
        );
    }

    destroy() {
        if (this.destroyed) {
            return;
        }

        this.clear();
        this.destroyed = true;
    }
}