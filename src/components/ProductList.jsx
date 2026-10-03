import ProductCard from "./ProductCard";
import { Link } from "react-router-dom";

function ProductList({ products, onDelete,deletingId }) {

    return (
        <div>

            {products.map(product => (
                <div>
                    <ProductCard
                        key={product.id}
                        product={product}
                        onDelete={onDelete}
                        deletingId={deletingId}
                    />

                    <div>
                        <Link to={`/products/${product.id}`}>
                            View Details
                        </Link>
                    </div>



                </div>





            ))}

        </div>
    );
}

export default ProductList;