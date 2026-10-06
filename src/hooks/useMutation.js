import { useCallback, useRef, useState } from "react";
import useApi from "./useApi";

function useMutation(mutationFunction) {

    const { request } = useApi();
    const controllerRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const execute = useCallback(
        async (...args) => {
            if (controllerRef.current) {controllerRef.current.abort();}
            const controller = new AbortController();
            controllerRef.current = controller;
            try {
                setLoading(true);
                setError("");
                const result = await mutationFunction(request,  ...args, controller.signal);
                return result;
            } 
            catch (error) {
                if (error.name === "AbortError") {return;}
                setError(error.message);
                throw error;
            } 
            finally {
                if (!controller.signal.aborted) {setLoading(false);}
            }
        },
        [mutationFunction, request]
    );

    return {execute, loading, error};
}
export default useMutation;