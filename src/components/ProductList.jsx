import ProductCard from "./ProductCard";

function ProductList({ products, onDelete }) {

    return (
        <div>

            {products.map(product => (

                <ProductCard
                    product={product}
                    onDelete={onDelete}
                />            
            ))}

        </div>
    );
}

export default ProductList;