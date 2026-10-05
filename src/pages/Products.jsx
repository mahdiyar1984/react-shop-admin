import useFetch from "../hooks/useFetch";
import {getProducts, deleteProduct} from "../api/productsApi";
import ProductList from "../components/ProductList";

function Products() {

    const {data: products, loading, error, execute: refreshProducts} = useFetch(getProducts);
    if (loading && !products) {return (<div>Loading products...</div>);}

    if (error) {
        return (
            <div>
                <p>Error: {error}</p>
                <button onClick={refreshProducts}>Try Again</button>
            </div>
        );
    }

    return (
        <div>
            <h1>Products</h1>
            <button onClick={refreshProducts} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh"}
            </button>
            <ProductList  products={products || []}/>
        </div>
    );
}

export default Products;