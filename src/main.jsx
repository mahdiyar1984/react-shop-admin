import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { QueryClientProvider } from "./query/QueryClientContext";
import { ProductProvider } from "./context/ProductContext";
import "./index.css";
import "./App.css";

ReactDOM.createRoot(
    document.getElementById("root")).render
    (
        <React.StrictMode>
            <ErrorBoundary>
                <BrowserRouter>
                    <QueryClientProvider>
                        <ProductProvider>
                            <App />
                        </ProductProvider>
                    </QueryClientProvider>
                </BrowserRouter>
            </ErrorBoundary>
        </React.StrictMode>
    );