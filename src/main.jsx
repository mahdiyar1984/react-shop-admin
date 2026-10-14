import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { QueryClientProvider } from "./query/QueryClientContext";
import { ProductProvider } from "./context/ProductContext";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <QueryClientProvider>
                <ProductProvider>
                    <App />
                </ProductProvider>
            </QueryClientProvider>
        </BrowserRouter>
    </React.StrictMode>
);