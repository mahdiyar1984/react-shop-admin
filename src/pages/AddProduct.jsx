import { useNavigate } from "react-router-dom";
import ProductForm from "../components/ProductForm";
import { createProduct as createProductApi } from "../api/productsApi";
import useMutation from "../hooks/useMutation";


function AddProduct() {
    const navigate = useNavigate();
    const {execute: createProduct, loading, error} = useMutation(createProductApi);

    async function handleSubmit(product) {
        try {
            await createProduct(product);
            navigate("/products");
        } 
        catch (error) {
        }
    }

    return (
        <div>
            <h1>Add Product</h1>
            {error && (<p>{error}</p>)}
            <ProductForm onSubmit={handleSubmit} loading={loading}/>
        </div>
    );
}
export default AddProduct;