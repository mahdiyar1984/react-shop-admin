import { useParams } from "react-router-dom";
import useQuery from "../hooks/useQuery";
import {getProduct} from "../api/productsApi";

function ProductDetail() {
    const { id } = useParams();
    const productQuery = useQuery(["products", Number(id)], getProduct, Number(id));

    const {data: product, loading, error} = productQuery;

    if (loading) { return <p>Loading...</p>;}
    if (error) { return <p>Error: {error}</p>;}
    if (!product) {return <p>Product not found.</p>;}

    return (
        <div>
            <h1>{product.name}</h1>

            <p>
                Price: {product.price}
            </p>

            <p>
                Category: {product.category}
            </p>
        </div>
    );
}

export default ProductDetail;