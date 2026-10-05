import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductForm from "../components/ProductForm";
import useApi from "../hooks/useApi";
import { createProduct } from "../api/productsApi";


function AddProduct({ onAddProduct }) {

    const navigate = useNavigate();
    const [productForm, setProductForm] = useState({ name: "", price: "", category: "" });
    const { request, loading, error } = useApi();

    function handleChange(event) {
        const { name, value } = event.target;
        setProductForm({
            ...productForm,
            [name]: value
        });
    }


    async function handleSubmit(event) {

        event.preventDefault();

        try {
            const data =
            await createProduct(request, productForm);
            onAddProduct(data);
            navigate("/products");

        } catch (error) {
            console.log(error);
        } 
    }


    return (
        <div>

            <h1>
                Add Product
            </h1>


            {error && (
                <p>
                    {error}
                </p>
            )}


            <ProductForm
                productForm={productForm}
                onChange={handleChange}
                onSubmit={handleSubmit}
                loading={loading}
                buttonText="Add Product"
            />

        </div>
    );
}


export default AddProduct;