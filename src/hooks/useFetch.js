import { useCallback, useEffect, useState, useRef } from "react";
import useApi from "./useApi";

function useFetch(fetchFunction, options = {}) {
    const { immediate = true } = options;
    const controllerRef = useRef(null);
    const { request } = useApi();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const execute = useCallback(
        async (...args) => {

            if (controllerRef.current) {
                controllerRef.current.abort();
            }

            const controller = new AbortController();
            controllerRef.current = controller;

            try {
                setLoading(true);
                setError("");
                const result = await fetchFunction(request, ...args, controller.signal);
                if (controller.signal.aborted) {return;}
                setData(result);
                return result;
            }

            catch (error) {
                if (error.name === "AbortError") { return; }
                setError(error.message);
                throw error;
            }

            finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }

        }, [fetchFunction, request]
    );

    useEffect(() => {
        if (!immediate) { return; }

        execute();

        return () => {
            if (controllerRef.current) {
                controllerRef.current.abort();
            }
        };
    }, [execute, immediate]);

    return { data, loading, error, execute };
}
export default useFetch;