import { useState } from "react";

function useApi() {

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function request(url, options = {}) {

        try {

            setLoading(true);
            setError("");

            const response = await fetch(
                url,
                options
            );

            if (!response.ok) {

                throw new Error(
                    "Request failed"
                );
            }

            // DELETE ممکن است body نداشته باشد
            if (response.status === 204) {
                return null;
            }

            const data = await response.json();

            return data;

        } catch (error) {

            setError(error.message);

            throw error;

        } finally {

            setLoading(false);

        }
    }

    return {
        request,
        loading,
        error
    };
}

export default useApi;