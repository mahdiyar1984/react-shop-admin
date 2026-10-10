import {useParams, useNavigate} from "react-router-dom";
import ProductForm from "../components/ProductForm";
import {useProducts} from "../context/ProductContext";

function EditProduct() {

    const { id } = useParams();
    const navigate = useNavigate();
    const {products, loading, updating, actionError, editProduct} = useProducts();
    const product = products.find(item => item.id === Number(id));

     async function handleSubmit(data) {
        try {
            await editProduct(Number(id), data);
            navigate("/products");
        } 
        catch (error) {
            // خطا در actionError قرار گرفته است.
        }
    }

    if (loading && products.length === 0) {
        return (
            <p>
                Loading products...
            </p>
        );
    }
    if (!product) {
        return (
            <p>
                Product not found.
            </p>
        );
    }

    return (
        <div>
            <h1>Edit Product</h1>
            {actionError  && (<p>{actionError }</p>)}
            <ProductForm initialData={product} onSubmit={handleSubmit} loading={updating} />
        </div>
    );
}
export default EditProduct;