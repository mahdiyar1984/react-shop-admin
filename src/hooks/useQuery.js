import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";

import useApi from "./useApi";
import { useQueryClient } from "../query/QueryClientContext";

function useQuery(queryKey, queryFunction, ...initialArgs) {
    const { request } = useApi();
    const queryClient = useQueryClient();
    const [data, setData] = useState(() => queryClient.getQueryData(queryKey) ?? null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const controllerRef = useRef(null);

    const execute = useCallback(
        async (...args) => {
            if (controllerRef.current) { controllerRef.current.abort(); }
            const controller = new AbortController();
            controllerRef.current = controller;
            try {
                setLoading(true);
                setError("");
                const result = await queryFunction(request, ...args, controller.signal);
                if (controller.signal.aborted) { return; }
                queryClient.setQueryData(queryKey, result);
                setData(result);
                return result;
            }
            catch (error) {
                if (error.name === "AbortError") { return; }
                setError(error.message);
                throw error;
            }
            finally {
                if (!controller.signal.aborted) { setLoading(false); }
            }
        },
        [queryClient, queryKey, queryFunction, request]
    );

    useEffect(() => {
        const unsubscribe =
            queryClient.subscribe(queryKey, () => {
                const cachedData = queryClient.getQueryData(queryKey);
                setData(cachedData ?? null);
            }
            );

        return unsubscribe;
    }, [queryClient, queryKey]);

    useEffect(() => {
        const cachedData = queryClient.getQueryData(queryKey);

        if (cachedData !== undefined) {
            setData(cachedData);
            return;
        }

        execute(...initialArgs).catch(() => { });

        return () => {
            if (controllerRef.current) {
                controllerRef.current.abort();
            }
        };
    }, [queryClient, queryKey, execute]);

    const setQueryData =
        useCallback(
            updater => { return queryClient.setQueryData(queryKey, updater);},
            [queryClient, queryKey]
        );

    const invalidateQuery =
        useCallback(
            () => {queryClient.invalidateQuery(queryKey);},
            [queryClient, queryKey]
        );

    return {
        data,
        loading,
        error,
        execute,
        refetch: execute,
        setQueryData,
        invalidateQuery
    };
}

export default useQuery;