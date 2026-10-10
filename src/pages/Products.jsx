import { useEffect } from "react";
import {useProducts} from "../context/ProductContext";
import ProductList from "../components/ProductList";

function Products() {
    const {products, loading, error, deleting, actionError, fetchProducts, removeProduct} = useProducts();
    useEffect(() => {
        fetchProducts().catch(() => {});
    }, [fetchProducts]);

    async function handleDelete(id) {
        try {
            await removeProduct(id);
        }
        catch (error) {
            // useMutation خطا را مدیریت کرده است.
        }
    }

    if (loading && products.length === 0) { return (<div>Loading products...</div>); }
    if (error) { return (<p>{error}</p>); }

    return (
        <div>
            <h1>Products</h1>
            {actionError && (<p>{actionError}</p>)}
            <ProductList products={products} onDelete={handleDelete} deleting={deleting}/>
        </div>
    );
}

export default Products;