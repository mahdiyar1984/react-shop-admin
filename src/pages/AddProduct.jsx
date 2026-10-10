import { useNavigate } from "react-router-dom";
import ProductForm from "../components/ProductForm";
import {useProducts} from "../context/ProductContext";


function AddProduct() {
    const navigate = useNavigate();
    const {addProduct, creating, actionError} = useProducts();

    async function handleSubmit(product) {
        try {
            await addProduct(product);
            navigate("/products");
        } 
        catch (error) {
            // خطا در actionError قرار گرفته است.
        }
    }

    return (
        <div>
            <h1>Add Product</h1>
            {actionError && (<p>{actionError}</p>)}
            <ProductForm onSubmit={handleSubmit} loading={creating}/>
        </div>
    );
}
export default AddProduct;