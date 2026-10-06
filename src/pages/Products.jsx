import useFetch from "../hooks/useFetch";
import useMutation from "../hooks/useMutation";
import { getProducts, deleteProduct as deleteProductApi } from "../api/productsApi";
import ProductList from "../components/ProductList";

function Products() {

    const { data: products, loading, error, execute: refreshProducts } = useFetch(getProducts);
    const { execute: deleteProduct, loading: deleting, error: deleteError } = useMutation(deleteProductApi);

    async function handleDelete(id) {
        try {
            await deleteProduct(id);
            await refreshProducts();
        }
        catch (error) {
            // useMutation خطا را مدیریت کرده است.
        }
    }

    if (loading && !products) { return (<div>Loading products...</div>); }
    if (error) { return (<p>{error}</p>); }

    return (
        <div>
            <h1>Products</h1>
            {deleteError && (<p>{deleteError}</p>)}
            {deleting && (<p>Deleting product...</p>)}
            <ProductList products={products || []} onDelete={handleDelete} deleting={deleting} />
        </div>
    );
}

export default Products;