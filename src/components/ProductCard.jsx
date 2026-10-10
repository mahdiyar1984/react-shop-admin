import { Link } from "react-router-dom";

function ProductCard({ product, onDelete, deleting }) {
    return (
        <div>
            <h3>{product.name}</h3>
            <p>Price: {product.price}</p>
            <p>Category: {product.category}</p>
            <Link to={`/products/${product.id}`}>View</Link>{" "}            
            <Link to={`/products/${product.id}/edit`}>Edit</Link>{" "}
            <button onClick={() => onDelete(product.id)} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</button>
        </div>
    );
}
export default ProductCard;