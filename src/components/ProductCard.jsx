import { Link } from "react-router-dom";

function ProductCard({ product }) {
    return (
        <div>
            <h3>
                {product.name}
            </h3>

            <p>
                Price: {product.price}
            </p>

            <p>
                Category: {product.category}
            </p>

            <Link to={`/products/${product.id}`}>
                View Details
            </Link>

            <Link to={`/products/${product.id}/edit`}>
                Edit
            </Link>
        </div>
    );
}
export default ProductCard;