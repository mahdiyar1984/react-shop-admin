import ProductList from "../components/ProductList";

function Products({ products, loading, error, onDelete , deletingId}) {

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div>

            <h1>Products</h1>

            <ProductList
                products={products}
                onDelete={onDelete}
                deletingId={deletingId}
            />

        </div>
    );
}

export default Products;