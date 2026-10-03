
function ProductCard({ product, onDelete, deletingId }) {

    return (
        <div>

            <h2>Title: {product.name}</h2>
            <p>Category: {product.category}</p>
            <p>Price: ${product.price}</p>           

            <button
                onClick={() => onDelete(product.id)}
                disabled={deletingId}
            >
                {deletingId
                    ? "Deleting..."
                    : "Delete"
                }
            </button>

        </div>
    );
}

export default ProductCard;