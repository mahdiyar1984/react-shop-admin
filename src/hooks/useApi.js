import { useCallback } from "react";

function useApi() {
    const request = useCallback(
        async (url, options = {}) => {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...(options.body !== undefined  ? {"Content-Type": "application/json",} : {}),
                    ...options.headers,
                },
            });

            if (!response.ok) {
                let message = `خطای سرور: ${response.status}`;

                try {
                    const data = await response.json();
                    message = data.detail || JSON.stringify(data) || message;
                } 
                catch {
                    // پاسخ ممکن است JSON نباشد.
                }

                const error = new Error(message);
                error.status = response.status;

                throw error;
            }

            if (response.status === 204) {
                return null;
            }

            return response.json();
        },
        []
    );

    return { request };
}

export default useApi;