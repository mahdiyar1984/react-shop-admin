import { createContext, useCallback, useContext, useState } from "react";
import ProductContext from "./ProductContext";
import useApi from "../hooks/useApi";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../api/productsApi";

const ProductContext = createContext(null);

function ProductProvider({ children }) {

    const { request } = useApi();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");

    // GET
    const fetchProducts = useCallback(
        async () => {
            try {
                setLoading(true);
                setError("");
                const data = await getProducts(request);
                setProducts(data);
                return data;
            }
            catch (error) {
                setError(error.message);
                throw error;
            }
            finally {
                setLoading(false);
            }
        },
        [request]
    );

    // POST
    const addProduct = useCallback(
        async (product) => {
            try {
                setCreating(true);
                setActionError("");
                const newProduct =
                    await createProduct(request, product);
                setProducts(prev => [
                    ...prev,
                    newProduct
                ]);
                return newProduct;
            }
            catch (error) {
                setActionError(error.message);
                throw error;
            }
            finally {
                setCreating(false);
            }
        },
        [request]
    );

    // PATCH
    const editProduct = useCallback(
        async (id, product) => {
            try {
                setUpdating(true);
                setActionError("");
                const updatedProduct = await updateProduct(request, id, product);
                setProducts(prev =>
                    prev.map(item =>
                        item.id === updatedProduct.id
                            ? updatedProduct
                            : item
                    )
                );
                return updatedProduct;
            }
            catch (error) {
                setActionError(error.message);
                throw error;
            }
            finally {
                setUpdating(false);
            }
        },
        [request]
    );

    // DELETE
    const removeProduct = useCallback(
        async (id) => {
            try {
                setDeleting(true);
                setActionError("");
                await deleteProduct(request, id);
                setProducts(prev =>
                    prev.filter(
                        item => item.id !== id
                    )
                );
            }
            catch (error) {
                setActionError(error.message);
                throw error;
            }
            finally {
                setDeleting(false);
            }
        },
        [request]
    );


    return (
        <ProductContext.Provider
            value={{
                products,

                loading,
                creating,
                updating,
                deleting,

                error,
                actionError,

                fetchProducts,
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
    useContext(ProductContext);
    if (!context) {
        throw new Error("useProducts must be used inside ProductProvider");
    }


    return context;
}

export default ProductProvider;