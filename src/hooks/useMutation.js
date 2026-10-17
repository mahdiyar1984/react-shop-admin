import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import useApi from "./useApi";
import { useQueryClient } from "../query/QueryClientContext";

const INITIAL_STATE = {
    data: null,
    error: null,
    status: "idle",
    loading: false,
    cancelled: false,
};

function useMutation(mutationFn, options = {}) {
    const queryClient = useQueryClient();
    const { request } = useApi();

    const [state, setState] = useState(INITIAL_STATE);

    const mountedRef = useRef(false);
    const sequenceRef = useRef(0);
    const latestIdRef = useRef(0);
    const controllersRef = useRef(new Map());

    const mutationFnRef = useRef(mutationFn);
    const optionsRef = useRef(options);

    mutationFnRef.current = mutationFn;
    optionsRef.current = options;

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;

            for (const controller of controllersRef.current.values()) {
                controller.abort();
            }

            controllersRef.current.clear();
            latestIdRef.current = ++sequenceRef.current;
        };
    }, []);

    const mutateAsync = useCallback(
        async (...args) => {
            const id = ++sequenceRef.current;
            latestIdRef.current = id;

            const variables =
                args.length === 1 ? args[0] : args;

            const controller = new AbortController();
            controllersRef.current.set(id, controller);

            const currentOptions = optionsRef.current;

            const requestWithSignal = (url, requestOptions = {}) =>
                request(url, {
                    ...requestOptions,
                    signal: controller.signal,
                });

            let data;
            let mutationError = null;

            if (mountedRef.current) {
                setState({
                    ...INITIAL_STATE,
                    status: "pending",
                    loading: true,
                });
            }

            try {
                await currentOptions.onMutate?.(variables);

                if (controller.signal.aborted) {
                    const error = new Error("عملیات لغو شد.");
                    error.name = "AbortError";
                    throw error;
                }

                data = await mutationFnRef.current(
                    requestWithSignal,
                    ...args
                );

                if (controller.signal.aborted) {
                    const error = new Error("عملیات لغو شد.");
                    error.name = "AbortError";
                    throw error;
                }

                if (
                    mountedRef.current &&
                    latestIdRef.current === id
                ) {
                    setState({
                        data,
                        error: null,
                        status: "success",
                        loading: false,
                        cancelled: false,
                    });
                }

                await currentOptions.onSuccess?.(
                    data,
                    variables
                );

                return data;
            } catch (error) {
                mutationError = error;

                const cancelled =
                    error?.name === "AbortError" ||
                    controller.signal.aborted;

                if (
                    mountedRef.current &&
                    latestIdRef.current === id
                ) {
                    setState({
                        data: null,
                        error: cancelled ? null : error,
                        status: cancelled ? "idle" : "error",
                        loading: false,
                        cancelled,
                    });
                }

                if (!cancelled) {
                    await currentOptions.onError?.(
                        error,
                        variables
                    );
                }

                throw error;
            } finally {
                controllersRef.current.delete(id);

                if (
                    mountedRef.current &&
                    latestIdRef.current === id
                ) {
                    setState((previous) => ({
                        ...previous,
                        loading: false,
                    }));
                }

                await currentOptions.onSettled?.(
                    data,
                    mutationError,
                    variables
                );
            }
        },
        [request]
    );

    const mutate = useCallback(
        (...args) => {
            mutateAsync(...args).catch(() => {
                // خطا در state ذخیره می‌شود.
            });
        },
        [mutateAsync]
    );

    const cancel = useCallback(() => {
        latestIdRef.current = ++sequenceRef.current;

        for (const controller of controllersRef.current.values()) {
            controller.abort();
        }

        controllersRef.current.clear();

        if (mountedRef.current) {
            setState({
                ...INITIAL_STATE,
                cancelled: true,
            });
        }
    }, []);

    const reset = useCallback(() => {
        latestIdRef.current = ++sequenceRef.current;

        for (const controller of controllersRef.current.values()) {
            controller.abort();
        }

        controllersRef.current.clear();

        if (mountedRef.current) {
            setState({ ...INITIAL_STATE });
        }
    }, []);

    return {
        ...state,
        mutate,
        mutateAsync,
        cancel,
        reset,
    };
}

export default useMutation;