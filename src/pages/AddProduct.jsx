
import { useNavigate } from "react-router-dom";
import ProductForm from "../components/ProductForm";
import { useProducts } from "../context/ProductContext";

function AddProduct() {
    const navigate = useNavigate();

    const {
        addProduct,
        creating,
        createError,
    } = useProducts();

    async function handleAddProduct(product) {
        await addProduct(product);
        navigate("/products");
    }

    return (
        <main dir="rtl">
            <h1>افزودن محصول</h1>

            <ProductForm
                onSubmit={handleAddProduct}
                loading={creating}
                error={createError}
                submitText="ثبت محصول"
            />
        </main>
    );
}

export default AddProduct;
