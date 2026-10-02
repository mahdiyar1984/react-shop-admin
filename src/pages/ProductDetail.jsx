import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";


function ProductDetail() {

    const { id } = useParams();
    
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function fetchProduct() {

        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `http://localhost:8000/api/products/${id}/`
            );


            if (!response.ok) {
                throw new Error(
                    "Product not found"
                );
            }


            const data = await response.json();
            setProduct(data);

        } catch (error) {
            setError(error.message);

        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        fetchProduct();
    }, [id]);


    if (loading) {

        return (
            <p>
                Loading...
            </p>
        );
    }


    if (error) {

        return (
            <p>
                {error}
            </p>
        );
    }


    return (

        <div>

            <h1>
                {product.name}
            </h1>

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