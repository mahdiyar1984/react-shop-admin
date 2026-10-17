import { useCallback, useEffect, useRef, useState,} from "react";
import useApi from "./useApi";
import { useQueryClient } from "../query/QueryClientContext";

const OPTION_KEYS = [
    "enabled",
    "staleTime",
    "cacheTime",
    "retry",
    "retryDelay",
];

function isQueryOptions(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        OPTION_KEYS.some((key) =>  Object.prototype.hasOwnProperty.call(value, key)
        )
    );
}

function useQuery(queryKey, queryFn, ...params) {
    const queryClient = useQueryClient();
    const { request } = useApi();

    const [version, setVersion] = useState(0);

    const queryKeyRef = useRef(queryKey);
    const queryFnRef = useRef(queryFn);
    const paramsRef = useRef(params);

    queryKeyRef.current = queryKey;
    queryFnRef.current = queryFn;
    paramsRef.current = params;

    const lastParam = params[params.length - 1];
    const hasOptions = isQueryOptions(lastParam);

    const options = hasOptions ? lastParam : {};
    const args = hasOptions ? params.slice(0, -1) : params;

    const argsRef = useRef(args);
    const optionsRef = useRef(options);

    argsRef.current = args;
    optionsRef.current = options;

    const serializedKey = JSON.stringify(queryKey);

    const enabled = options.enabled ?? true;

    const execute = useCallback(
        (executeOptions = {}) => {
            const currentQueryFn = queryFnRef.current;

            if (typeof currentQueryFn !== "function") {
                return Promise.reject(
                    new Error("تابع queryFn باید یک تابع معتبر باشد.")
                );
            }

            const requestWithSignal = (url, requestOptions = {}) => {
                return request(url, requestOptions);
            };

            const queryFunctionWithSignal = ({ signal }) => {
                const requestWithAbort = (url, requestOptions = {}) =>
                    request(url, {
                        ...requestOptions,
                        signal,
                    });

                return currentQueryFn(
                    requestWithAbort,
                    ...argsRef.current
                );
            };

            return queryClient.fetchQuery(
                queryKeyRef.current,
                queryFunctionWithSignal,
                {
                    ...optionsRef.current,
                    ...executeOptions,
                }
            );
        },
        [queryClient, request]
    );

    useEffect(() => {
        const currentKey = queryKeyRef.current;

        queryClient.ensureQuery(currentKey, optionsRef.current);

        const unsubscribe = queryClient.subscribe(
            currentKey,
            () => {
                setVersion((current) => current + 1);
            }
        );

        return unsubscribe;
    }, [queryClient, serializedKey]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const state = queryClient.getQueryState(
            queryKeyRef.current
        );

        if (
            !state ||
            state.data === undefined ||
            state.invalidated === true
        ) {
            execute().catch(() => {});
        }
    }, [
        queryClient,
        serializedKey,
        enabled,
        execute,
    ]);

    const state =
        queryClient.getQueryState(queryKey) ?? {
            data: undefined,
            error: null,
            status: "idle",
            loading: false,
            fetching: false,
            updatedAt: 0,
            staleTime: options.staleTime ?? 0,
            invalidated: false,
        };

    const refetch = useCallback(() => {
        return execute({ force: true });
    }, [execute]);

    const cancel = useCallback(() => {
        return queryClient.cancelQuery(queryKeyRef.current);
    }, [queryClient]);

    const setQueryData = useCallback(
        (updater) => {
            return queryClient.setQueryData(
                queryKeyRef.current,
                updater
            );
        },
        [queryClient, serializedKey]
    );

    const invalidateQuery = useCallback(() => {
        return queryClient.invalidateQuery(queryKeyRef.current);
    }, [queryClient, serializedKey]);

    const stale =
        state.data === undefined ||
        state.invalidated === true ||
        (
            state.updatedAt > 0 &&
            options.staleTime !== Infinity &&
            Date.now() - state.updatedAt >=
                (options.staleTime ?? state.staleTime ?? 0)
        );

    void version;

    return {
        data: state.data,
        error: state.error ?? null,
        status: state.status ?? "idle",
        loading: state.loading ?? false,
        fetching: state.fetching ?? false,
        cancelled: false,
        stale,
        enabled,
        refetch,
        execute: refetch,
        cancel,
        setQueryData,
        invalidateQuery,
    };
}

export default useQuery;