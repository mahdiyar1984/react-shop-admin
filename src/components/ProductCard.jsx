
function ProductCard({ product, onDelete }) {

    return (
        <div>

            <h2>Title: {product.name}</h2>
            <p>Category: {product.category}</p>
            <p>Price: ${product.price}</p>           

            <button onClick={() => onDelete(product.id)}>Delete</button>

        </div>
    );
}

export default ProductCard;