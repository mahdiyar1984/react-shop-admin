import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import { getProduct } from "../api/productsApi";


function ProductDetail() {

    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const { request, loading, error } = useApi();

    async function fetchProduct() {

        try {
            const data = await getProduct(request, id);
            setProduct(data);
        } catch (error) {
            console.log(error);
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
            <Link to={`/products/${id}/edit`}>
                Edit Product
            </Link>

        </div>
    );
}


export default ProductDetail;