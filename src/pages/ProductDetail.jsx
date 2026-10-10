import {Link, useParams} from "react-router-dom";
import {useProducts} from "../context/ProductContext";

function ProductDetail() {
    const { id } = useParams();
    const {products, loading} = useProducts();
    const product = products.find(item => item.id === Number(id));
    if (loading && products.length === 0) {return (<p>Loading...</p>);}
    if (!product) {return (<p>Product not found.</p>);}

    return (
        <div>
            <h1>{product.name}</h1>
            <p>Price: {product.price}</p>
            
            <Link to={`/products/${product.id}/edit`}>Edit</Link>
        </div>
    );
}

export default ProductDetail;