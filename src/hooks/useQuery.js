import {useCallback, useEffect, useRef, useState} from "react";
import useApi from "./useApi";

function useQuery(queryFunction, ...initialArgs) {
    const { request } = useApi();
    const [data, setData] = useState(null);
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
                const result = await queryFunction(request,  ...args, controller.signal);
                if (controller.signal.aborted) {return;}
                setData(result);
                return result;
            }             
            catch (error) {
                if (error.name === "AbortError") {return;}
                setError(error.message);
                throw error;
            }             
            finally { if (!controller.signal.aborted) {setLoading(false);} }
        },
        [queryFunction, request]
    );

    const updateData = useCallback( (updater) => { setData(updater); }, []);

    useEffect(() => {
        execute(...initialArgs).catch( () => {} );
        return () => {if (controllerRef.current) { controllerRef.current.abort();}};
    }, [execute]);

    return {data, loading, error, execute, refetch: execute, updateData};
}

export default useQuery;