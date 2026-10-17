import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import useApi from "./useApi";
import { useQueryClient } from "../query/QueryClientContext";

function useInfiniteQuery(
    queryKey,
    queryFunction,
    options = {}
) {
    const queryClient = useQueryClient();
    const { request } = useApi();

    const {
        initialPageParam = 1,
        getNextPageParam,
        staleTime = 30_000,
        cacheTime = 300_000,
        prefetch = true,
    } = options;

    const stableKey = useMemo(
        () => JSON.stringify(queryKey),
        [JSON.stringify(queryKey)]
    );

    const actualKey = useMemo(
        () => JSON.parse(stableKey),
        [stableKey]
    );

    const [state, setState] = useState(() =>
        queryClient.getQueryState(actualKey) ?? {
            data: undefined,
            error: null,
            status: "idle",
            loading: false,
            fetching: false,
            updatedAt: 0,
            staleTime,
            invalidated: false,
            cancelled: false,
        }
    );

    const [isFetchingNextPage, setIsFetchingNextPage] =
        useState(false);

    const fetchingNextPageRef = useRef(false);

    const prefetchedPages = useRef(new Map());
    const prefetchPromises = useRef(new Map());

    useEffect(() => {
        return queryClient.subscribe(
            actualKey,
            setState
        );
    }, [queryClient, stableKey]);

    const fetchPage = useCallback(
        async (pageParam) => {
            const pageKey = JSON.stringify(pageParam);

            const queryFunctionWithSignal = async (
                signal,
                param
            ) => {
                const paramKey = JSON.stringify(param);

                if (prefetchedPages.current.has(paramKey)) {
                    const cachedPage =
                        prefetchedPages.current.get(paramKey);

                    prefetchedPages.current.delete(paramKey);

                    return cachedPage;
                }

                const pendingPrefetch =
                    prefetchPromises.current.get(paramKey);

                if (pendingPrefetch) {
                    const page = await pendingPrefetch;

                    prefetchedPages.current.delete(paramKey);

                    return page;
                }

                const requestWithSignal = (
                    url,
                    requestOptions = {}
                ) =>
                    request(url, {
                        ...requestOptions,
                        signal,
                    });

                return queryFunction(
                    requestWithSignal,
                    param
                );
            };

            return queryClient.fetchInfiniteQuery(
                actualKey,
                queryFunctionWithSignal,
                pageParam,
                {
                    staleTime,
                    cacheTime,
                }
            );
        },
        [
            queryClient,
            stableKey,
            queryFunction,
            request,
            staleTime,
            cacheTime,
        ]
    );

    useEffect(() => {
        const current =
            queryClient.getQueryState(actualKey);

        if (current.data?.pages?.length) {
            return;
        }

        fetchPage(initialPageParam).catch(() => { });
    }, [
        queryClient,
        stableKey,
        fetchPage,
        initialPageParam,
    ]);

    const pages = state.data?.pages || [];
    const pageParams = state.data?.pageParams || [];

    const lastPage =
        pages.length > 0
            ? pages[pages.length - 1]
            : undefined;

    const nextPageParam = lastPage
        ? getNextPageParam(
            lastPage,
            pages,
            pageParams
        )
        : undefined;

    const hasNextPage =
        nextPageParam !== undefined &&
        nextPageParam !== null;

    const prefetchNextPage = useCallback(() => {
        if (
            !prefetch ||
            !hasNextPage ||
            state.loading ||
            fetchingNextPageRef.current
        ) {
            return Promise.resolve();
        }

        const pageKey = JSON.stringify(nextPageParam);

        if (
            prefetchedPages.current.has(pageKey) ||
            prefetchPromises.current.has(pageKey)
        ) {
            return (
                prefetchPromises.current.get(pageKey) ||
                Promise.resolve()
            );
        }

        const promise = Promise.resolve()
            .then(() =>
                queryFunction(request, nextPageParam)
            )
            .then((page) => {
                prefetchedPages.current.set(
                    pageKey,
                    page
                );

                return page;
            })
            .finally(() => {
                prefetchPromises.current.delete(
                    pageKey
                );
            });

        prefetchPromises.current.set(
            pageKey,
            promise
        );

        return promise.catch(() => { });
    }, [
        prefetch,
        hasNextPage,
        state.loading,
        nextPageParam,
        queryFunction,
        request,
    ]);

    const fetchNextPage = useCallback(async () => {
        if (
            !hasNextPage ||
            fetchingNextPageRef.current
        ) {
            return;
        }

        fetchingNextPageRef.current = true;
        setIsFetchingNextPage(true);

        try {
            await fetchPage(nextPageParam);
        } catch {
            // خطا از طریق state مربوط به QueryClient نمایش داده می‌شود.
        } finally {
            fetchingNextPageRef.current = false;
            setIsFetchingNextPage(false);
        }
    }, [
        hasNextPage,
        fetchPage,
        nextPageParam,
    ]);

    useEffect(() => {
        if (
            prefetch &&
            hasNextPage &&
            !state.loading &&
            !isFetchingNextPage
        ) {
            prefetchNextPage();
        }
    }, [
        prefetch,
        hasNextPage,
        state.loading,
        isFetchingNextPage,
        prefetchNextPage,
    ]);

    const cancel = useCallback(
        () =>
            queryClient.cancelInfiniteQuery(
                actualKey
            ),
        [queryClient, stableKey]
    );

    return {
        data: state.data,
        pages,
        pageParams,

        loading: state.loading,
        error: state.error,
        cancelled: state.cancelled,

        hasNextPage,
        isFetchingNextPage,

        fetchNextPage,
        prefetchNextPage,
        cancel,
    };
}

export default useInfiniteQuery;