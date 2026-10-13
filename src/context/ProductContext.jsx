import {createContext, useContext} from "react";
import useQuery from "../hooks/useQuery";
import useMutation from "../hooks/useMutation";
import {getProducts, createProduct, updateProduct, deleteProduct} from "../api/productsApi";

const ProductContext = createContext(null);

const PRODUCTS_QUERY_KEY = ["products"];

export function ProductProvider({children}) {
    const productsQuery = useQuery(PRODUCTS_QUERY_KEY, getProducts);
    const createMutation = useMutation(createProduct);
    const updateMutation = useMutation(updateProduct);
    const deleteMutation = useMutation(deleteProduct);

    async function addProduct(product) {
        const newProduct = await createMutation.execute(product);
        productsQuery.setQueryData(
            prev => [
                ...(prev || []),
                newProduct
            ]
        );
        return newProduct;
    }

    async function editProduct(id, product) {
        const updatedProduct = await updateMutation.execute(id, product);
        productsQuery.setQueryData(
            prev =>
                (prev || []).map(item =>
                    item.id ===
                    updatedProduct.id
                        ? updatedProduct
                        : item
                )
        );
        return updatedProduct;
    }

    async function removeProduct(id) {
        await deleteMutation.execute(id);
        productsQuery.setQueryData(
            prev =>
                (prev || []).filter(
                    item => item.id !== id
                )
        );
    }

    return (
        <ProductContext.Provider
            value={{
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
                removeProduct
            }}
        >
            {children}
        </ProductContext.Provider>
    );
}

export function useProducts() {
    const context = useContext(ProductContext);
    if (!context) { throw new Error("useProducts must be used inside ProductProvider");}
    return context;
}