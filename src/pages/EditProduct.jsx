import { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductForm from "../components/ProductForm";
import { getProduct, updateProduct as updateProductApi } from "../api/productsApi";
import useFetch from "../hooks/useFetch";
import useMutation from "../hooks/useMutation";

function EditProduct() {

    const { id } = useParams();
    const navigate = useNavigate();
    const fetchProduct = useCallback((request, signal) => getProduct(request, id, signal), [id]);
    const { data: product, loading: loadingProduct, error: productError } = useFetch(fetchProduct);
    const { execute: updateProduct, loading: updating, error: updateError } = useMutation(updateProductApi);

    async function handleSubmit(data) {
        try {
            await updateProduct(id, data);
            navigate("/products");
        }
        catch (error) {
            console.error("UPDATE ERROR:", error);
        }
    }

    if (loadingProduct) { return (<p>Loading product...</p>); }
    if (productError) { return (<p>{productError}</p>); }
    if (!product) { return (<p>Product not found.</p>); }

    return (
        <div>
            <h1>Edit Product</h1>
            {updateError && (<p>{updateError}</p>)}
            <ProductForm initialData={product} onSubmit={handleSubmit} loading={updating} />
        </div>
    );
}
export default EditProduct;