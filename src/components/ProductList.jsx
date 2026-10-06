import ProductCard from "./ProductCard";


function ProductList({ products, onDelete, deleting }) {
    if (products.length === 0) {
        return (<p>No products found.</p>);
    }

    return (
        <div>
            {products.map(product => (
                <ProductCard key={product.id} product={product} onDelete={onDelete} deleting={deleting} />
            ))}
        </div>
    );
}

export default ProductList;