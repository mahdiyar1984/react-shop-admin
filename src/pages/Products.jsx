import ProductList from "../components/ProductList";

function Products({ products, loading, error, onDelete, deletingId, actionError, onRefresh }) {

    if (loading) {
        return (
            <div>
                <h1>Products</h1>
                <p>Loading products...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div>

                <h1>Products</h1>

                <p>{error}</p>

                <button onClick={onRefresh}>
                    Try Again
                </button>
                
            </div>
        );
    }


    return (
        <div>

            <h1>Products</h1>

            {actionError && (
                <p>
                    {actionError}
                </p>
            )}

            <ProductList
                products={products}
                onDelete={onDelete}
                deletingId={deletingId}
            />

        </div>
    );
}

export default Products;