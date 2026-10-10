import { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProduct } from "../api/productsApi";
import useFetch from "../hooks/useFetch";

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const fetchProduct = useCallback((request, signal) => getProduct(request, id, signal), [id]);
    const { data: product, loading, error} = useFetch(fetchProduct);

    if (loading) {return <p>Loading product...</p>;}
    if (error) {return <p>{error}</p>;}
    if (!product) {return <p>Product not found.</p>;}

    return (
        <div>
            <h1>Product Detail</h1>
            <div>
                <p><strong>ID:</strong> {product.id}</p>
                <p><strong>Name:</strong> {product.name}</p>
                <p><strong>Price:</strong> {product.price}</p>
                <p><strong>Category:</strong> {product.category}</p>
            </div>

            <button onClick={() => navigate("/products")}>Back to Products</button>

        </div>
    );
}

export default ProductDetail;
