
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import useApi from "./useApi";
import { useQueryClient } from "../query/QueryClientContext";

const OPTION_KEYS = [
    "enabled",
    "staleTime",
    "cacheTime",
    "retry",
    "retryDelay",
];

function useQuery(queryKey, queryFunction, ...inputArgs) {
    const queryClient = useQueryClient();
    const { request } = useApi();

    const lastArg = inputArgs[inputArgs.length - 1];

    const hasOptions =
        lastArg !== null &&
        typeof lastArg === "object" &&
        !Array.isArray(lastArg) &&
        OPTION_KEYS.some((key) =>
            Object.prototype.hasOwnProperty.call(lastArg, key)
        );

    const options = hasOptions ? inputArgs.pop() : {};
    const args = inputArgs;

    const stableKey = JSON.stringify(queryKey);

    const actualKey = useMemo(
        () => JSON.parse(stableKey),
        [stableKey]
    );

    const stableArgs = useMemo(
        () => args,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [stableKey, ...args]
    );

    const enabled = options.enabled ?? true;
    const staleTime = options.staleTime;
    const cacheTime = options.cacheTime;
    const retry = options.retry;
    const retryDelay = options.retryDelay;

    const execute = useCallback(
        (executeOptions = {}) => {
            const queryFunctionWithSignal = (signal, ...queryArgs) => {
                const requestWithSignal = (url, requestOptions = {}) => request(url, { ...requestOptions, signal});
                return queryFunction(requestWithSignal, ...queryArgs);
            };

            const settings = {
                staleTime,
                cacheTime,
                retry,
                retryDelay,
                ...executeOptions,
                queryFunction: queryFunctionWithSignal,
                args: stableArgs,
            };

            queryClient.queryOptions.set(stableKey, {
                ...queryClient.defaultOptions,
                ...settings,
            });

            return queryClient.fetchQuery(
                actualKey,
                queryFunctionWithSignal,
                stableArgs,
                settings
            );
        },
        [
            queryClient,
            stableKey,
            queryFunction,
            request,
            stableArgs,
            staleTime,
            cacheTime,
            retry,
            retryDelay,
        ]
    );

    const [state, setState] = useState(
        () => queryClient.getQueryState(actualKey)
    );

    useEffect(() => {
        const unsubscribe = queryClient.subscribe(
            actualKey,
            setState
        );

        if (enabled) {
            execute().catch(() => {
                // خطا در وضعیت همین Query ذخیره می‌شود.
            });
        }

        return unsubscribe;
    }, [
        queryClient,
        stableKey,
        execute,
        enabled,
    ]);

    const refetch = useCallback(
        () => execute({ force: true }),
        [execute]
    );

    const cancel = useCallback(
        () => queryClient.cancelQuery(actualKey),
        [queryClient, stableKey]
    );

    const setQueryData = useCallback(
        (updater) =>
            queryClient.setQueryData(actualKey, updater),
        [queryClient, stableKey]
    );

    const invalidateQuery = useCallback(
        () => queryClient.invalidateQuery(actualKey),
        [queryClient, stableKey]
    );

    return {
        data: state.data,
        loading: state.loading,
        error: state.error,
        cancelled: state.cancelled,
        stale: state.stale,
        enabled,
        execute,
        refetch,
        cancel,
        setQueryData,
        invalidateQuery,
    };
}

export default useQuery;
