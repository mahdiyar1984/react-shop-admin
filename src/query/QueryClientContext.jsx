import {createContext, useContext, useState,} from "react";
import QueryClient from "./QueryClient";

const QueryClientContext = createContext(null);

export function QueryClientProvider({ children }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                staleTime: 0,
                cacheTime: 300_000,
                retry: 2,
                retryDelay: 500,
            })
    );

    return (
        <QueryClientContext.Provider value={queryClient}>
            {children}
        </QueryClientContext.Provider>
    );
}

export function useQueryClient() {
    const queryClient = useContext(QueryClientContext);
    if (queryClient === null) {
        throw new Error(
            "useQueryClient باید داخل QueryClientProvider استفاده شود."
        );
    }
    return queryClient;
}