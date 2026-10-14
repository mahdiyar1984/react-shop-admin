
import { createContext, useContext } from "react";

import useQuery from "../hooks/useQuery";
import useMutation from "../hooks/useMutation";

import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../api/productsApi";

import { useQueryClient } from "../query/QueryClientContext";

const ProductContext = createContext(null);

export const PRODUCTS_QUERY_KEY = ["products"];

export function ProductProvider({ children }) {
    const queryClient = useQueryClient();

    const productsQuery = useQuery(
        PRODUCTS_QUERY_KEY,
        getProducts,
        {
            staleTime: 30_000,
            cacheTime: 300_000,
            retry: 2,
            retryDelay: 500,
        }
    );

    const createMutation = useMutation(createProduct);
    const updateMutation = useMutation(updateProduct);
    const deleteMutation = useMutation(deleteProduct);

    async function addProduct(product) {
        const newProduct = await createMutation.execute(product);

        queryClient.setQueryData(
            PRODUCTS_QUERY_KEY,
            previous => {
                const products = previous || [];

                if (
                    products.some(item => item.id === newProduct.id)
                ) {
                    return products;
                }

                return [...products, newProduct];
            }
        );

        queryClient.setQueryData(
            ["products", Number(newProduct.id)],
            newProduct
        );

        return newProduct;
    }

    async function editProduct(id, product) {
        const updatedProduct = await updateMutation.execute(
            id,
            product
        );

        queryClient.setQueryData(
            PRODUCTS_QUERY_KEY,
            previous =>
                (previous || []).map(item =>
                    item.id === updatedProduct.id
                        ? updatedProduct
                        : item
                )
        );

        queryClient.setQueryData(
            ["products", Number(id)],
            updatedProduct
        );

        return updatedProduct;
    }

    async function removeProduct(id) {
        await deleteMutation.execute(id);

        queryClient.setQueryData(
            PRODUCTS_QUERY_KEY,
            previous =>
                (previous || []).filter(
                    item => item.id !== Number(id)
                )
        );

        queryClient.removeQuery(["products", Number(id)]);
    }

    const value = {
        products: productsQuery.data || [],
        loading: productsQuery.loading,
        error: productsQuery.error,
        refetch: productsQuery.refetch,

        creating: createMutation.loading,
        createError: createMutation.error,

        updating: updateMutation.loading,
        updateError: updateMutation.error,

        deleting: deleteMutation.loading,
        deleteError: deleteMutation.error,

        addProduct,
        editProduct,
        removeProduct,
    };

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
}

export function useProducts() {
    const context = useContext(ProductContext);

    if (!context) {
        throw new Error(
            "useProducts must be used inside ProductProvider"
        );
    }

    return context;
}

export default ProductContext;
