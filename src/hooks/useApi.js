import { useCallback } from "react";

function useApi() {
    const request = useCallback(
        async (url, options = {}) => {
            const response = await fetch(url, options);
            if (!response.ok) { throw new Error("Request failed"); }
            if (response.status === 204) { return null; }
            return response.json();
        }, []
    );
    return { request };
}
export default useApi;