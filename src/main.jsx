import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { QueryClientProvider } from "./query/QueryClientContext";
import { ProductProvider } from "./context/ProductContext";

ReactDOM.createRoot(document.getElementById("root"))
  .render(
    <React.StrictMode>
      <QueryClientProvider>
        <ProductProvider>
          <App />
        </ProductProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );