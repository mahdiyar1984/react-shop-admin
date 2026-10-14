
import { useCallback, useRef, useState } from "react";
import useApi from "./useApi";

function useMutation(mutationFunction) {
    const { request } = useApi();

    const lockRef = useRef(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const execute = useCallback(
        async (...args) => {
            if (lockRef.current) {
                throw new Error("این عملیات در حال اجرا است.");
            }

            lockRef.current = true;
            setLoading(true);
            setError("");
            setSuccess(false);

            try {
                const result = await mutationFunction(
                    request,
                    ...args
                );

                setSuccess(true);
                return result;
            } catch (err) {
                setError(
                    err?.message || "عملیات با خطا مواجه شد."
                );

                throw err;
            } finally {
                lockRef.current = false;
                setLoading(false);
            }
        },
        [mutationFunction, request]
    );

    const reset = useCallback(() => {
        setError("");
        setSuccess(false);
    }, []);

    return {
        execute,
        loading,
        error,
        success,
        reset,
    };
}

export default useMutation;
