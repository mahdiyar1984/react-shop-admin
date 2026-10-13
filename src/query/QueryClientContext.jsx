import { createContext, useContext, useState } from "react";
import QueryClient from "./QueryClient";

const QueryClientContext = createContext(null);

export function QueryClientProvider({ children }) {
    const [queryClient] = useState(() => new QueryClient());
    return (<QueryClientContext.Provider value={queryClient}>{children}</QueryClientContext.Provider>);
}

export function useQueryClient() {
    const queryClient = useContext(QueryClientContext);
    if (!queryClient) { throw new Error("useQueryClient must be used inside QueryClientProvider");}
    return queryClient;
}