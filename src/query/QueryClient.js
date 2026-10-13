class QueryClient {
    constructor() {
        this.cache = new Map();
        this.subscribers = new Map();
    }

    getKey(queryKey) {
        return JSON.stringify(queryKey);
    }

    getQueryData(queryKey) {
        const key = this.getKey(queryKey);
        return this.cache.get(key)?.data;
    }

    setQueryData(queryKey, updater) {
        const key = this.getKey(queryKey);
        const currentData = this.cache.get(key)?.data ?? null;
        const newData = typeof updater === "function" ? updater(currentData) : updater;
        const currentEntry = this.cache.get(key) || {};
        this.cache.set(key, { ...currentEntry, data: newData, stale: false,});
        this.notify(queryKey);
        return newData;
    }

    invalidateQuery(queryKey) {
        const key = this.getKey(queryKey);
        const currentEntry = this.cache.get(key);

        if (!currentEntry) { return; }

        this.cache.set(key, {...currentEntry,  stale: true});

        this.notify(queryKey);
    }

    subscribe(queryKey, callback) {
        const key = this.getKey(queryKey);

        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }

        const listeners =
            this.subscribers.get(key);

        listeners.add(callback);

        return () => {
            listeners.delete(callback);

            if (listeners.size === 0) {
                this.subscribers.delete(key);
            }
        };
    }

    notify(queryKey) {
        const key = this.getKey(queryKey);

        const listeners =
            this.subscribers.get(key);

        if (!listeners) {
            return;
        }

        listeners.forEach(callback => {
            callback();
        });
    }
}

export default QueryClient;