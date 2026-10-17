// src/hooks/useQueries.js

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import useApi from "./useApi";
import { useQueryClient } from "../query/QueryClientContext";

const INITIAL_STATE = {
    data: undefined,
    error: null,
    status: "idle",
    loading: false,
    fetching: false,
    updatedAt: 0,
    invalidated: false,
    cancelled: false,
};

function useQueries(queries = []) {
    const queryClient = useQueryClient();
    const { request } = useApi();

    const queriesRef = useRef(queries);
    queriesRef.current = queries;

    const [version, setVersion] = useState(0);

    // جلوگیری از اجرای دوباره Effectها در هر Render
    // وقتی مشخصات Queryها تغییر نکرده‌اند.
    const signature = JSON.stringify(
        queries.map((query) => ({
            queryKey: query.queryKey,
            args: query.args ?? [],
            enabled:
                query.enabled ??
                query.options?.enabled ??
                true,
            options: query.options ?? {},
        }))
    );

    const stableQueries = useMemo(
        () =>
            queriesRef.current.map((query) => ({
                ...query,
                args: query.args ?? [],
                options: query.options ?? {},
                enabled:
                    query.enabled ??
                    query.options?.enabled ??
                    true,
            })),
        // مشخصات Queryها معیار تغییر هستند.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [signature]
    );

    const readQueryState = useCallback(
        (queryKey) =>
            queryClient.getQueryState(queryKey) ??
            INITIAL_STATE,
        [queryClient]
    );

    const executeQuery = useCallback(
        (query, executeOptions = {}) => {
            if (typeof query.queryFn !== "function") {
                return Promise.reject(
                    new Error(
                        "تابع queryFn برای این Query معتبر نیست."
                    )
                );
            }

            const queryFunctionWithSignal = ({ signal }) => {
                const requestWithSignal = (
                    url,
                    requestOptions = {}
                ) =>
                    request(url, {
                        ...requestOptions,
                        signal,
                    });

                return query.queryFn(
                    requestWithSignal,
                    ...(query.args ?? [])
                );
            };

            return queryClient.fetchQuery(
                query.queryKey,
                queryFunctionWithSignal,
                {
                    ...query.options,
                    ...executeOptions,
                }
            );
        },
        [queryClient, request]
    );

    // ثبت Queryها و گوش‌دادن به تغییرات Cache
    useEffect(() => {
        const unsubscribers = [];

        for (const query of stableQueries) {
            queryClient.ensureQuery(query.queryKey, {
                staleTime: query.options.staleTime,
                cacheTime: query.options.cacheTime,
                retry: query.options.retry,
                retryDelay: query.options.retryDelay,
            });

            const unsubscribe = queryClient.subscribe(
                query.queryKey,
                () => {
                    setVersion((current) => current + 1);
                }
            );

            unsubscribers.push(unsubscribe);
        }

        return () => {
            unsubscribers.forEach((unsubscribe) => {
                if (typeof unsubscribe === "function") {
                    unsubscribe();
                }
            });
        };
    }, [queryClient, signature, stableQueries]);

    // اجرای Queryهای فعال
    useEffect(() => {
        for (const query of stableQueries) {
            if (!query.enabled) {
                continue;
            }

            const state = readQueryState(query.queryKey);

            const needsFetch =
                state.data === undefined ||
                state.invalidated === true;

            if (needsFetch) {
                executeQuery(query).catch(() => {
                    // خطا در Cache ذخیره می‌شود و از نتیجه خوانده می‌شود.
                });
            }
        }
    }, [
        signature,
        stableQueries,
        executeQuery,
        readQueryState,
    ]);

    const refetch = useCallback(
        (index) => {
            const query = queriesRef.current[index];

            if (!query) {
                return Promise.reject(
                    new Error("Query موردنظر پیدا نشد.")
                );
            }

            return executeQuery(
                {
                    ...query,
                    args: query.args ?? [],
                    options: query.options ?? {},
                },
                { force: true }
            );
        },
        [executeQuery]
    );

    const cancel = useCallback(
        (index) => {
            const query = queriesRef.current[index];

            if (!query) {
                return false;
            }

            return queryClient.cancelQuery(query.queryKey);
        },
        [queryClient]
    );

    const results = stableQueries.map((query, index) => {
        const state = readQueryState(query.queryKey);

        const setQueryData = (updater) =>
            queryClient.setQueryData(
                query.queryKey,
                updater
            );

        const invalidateQuery = () =>
            queryClient.invalidateQuery(query.queryKey);

        const stale =
            state.data === undefined ||
            state.invalidated === true ||
            (
                state.updatedAt > 0 &&
                Date.now() - state.updatedAt >=
                    (
                        state.staleTime ??
                        query.options.staleTime ??
                        queryClient.defaultOptions.staleTime
                    )
            );

        return {
            queryKey: query.queryKey,
            data: state.data,
            error: state.error ?? null,
            status: state.status ?? "idle",
            loading: state.loading ?? false,
            fetching: state.fetching ?? false,
            cancelled: state.cancelled ?? false,
            stale,
            enabled: query.enabled,

            refetch: () => refetch(index),
            execute: () => refetch(index),
            cancel: () => cancel(index),
            setQueryData,
            invalidateQuery,
        };
    });

    // باعث Render مجدد پس از تغییر وضعیت Cache می‌شود.
    void version;

    return results;
}

export default useQueries;