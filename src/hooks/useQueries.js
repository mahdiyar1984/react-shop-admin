
import { useEffect, useMemo, useState } from "react";
import useQuery from "./useQuery";

function useQueries(queries) {
    const stableQueries = useMemo(
        () =>
            queries.map((query) => ({
                ...query,
                queryKey: JSON.stringify(query.queryKey),
            })),
        [JSON.stringify(queries)]
    );

    const [results, setResults] = useState([]);

    useEffect(() => {
        let active = true;

        const initialResults = stableQueries.map((query) => ({
            queryKey: query.queryKey,
            data: undefined,
            loading: query.enabled !== false,
            error: null,
            cancelled: false,
        }));

        setResults(initialResults);

        async function runQueries() {
            const promises = stableQueries.map(
                async (query, index) => {
                    if (query.enabled === false) {
                        return {
                            queryKey: query.queryKey,
                            data: undefined,
                            loading: false,
                            error: null,
                            cancelled: false,
                        };
                    }

                    try {
                        const data = await query.queryFn(
                            ...(query.args || [])
                        );

                        return {
                            queryKey: query.queryKey,
                            data,
                            loading: false,
                            error: null,
                            cancelled: false,
                        };
                    } catch (error) {
                        return {
                            queryKey: query.queryKey,
                            data: undefined,
                            loading: false,
                            error,
                            cancelled:
                                error?.name === "AbortError",
                        };
                    }
                }
            );

            const settledResults = await Promise.all(promises);

            if (active) {
                setResults(settledResults);
            }
        }

        runQueries();

        return () => {
            active = false;
        };
    }, [stableQueries]);

    return results;
}

export default useQueries;
