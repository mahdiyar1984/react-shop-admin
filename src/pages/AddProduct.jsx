import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductForm from "../components/ProductForm";


function AddProduct({ onAddProduct }) {

    const navigate = useNavigate();
    const [productForm, setProductForm] = useState({
        name: "",
        price: "",
        category: ""
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);


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

            setSaving(true);
            setError("");

            const response = await fetch(
                "http://localhost:8000/api/products/",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(productForm)
                }
            );


            if (!response.ok) {
                throw new Error(
                    "Failed to create product"
                );
            }


            const data = await response.json();
            onAddProduct(data);
            navigate("/products");


        } catch (error) {
            setError(error.message);

        } finally {
            setSaving(false);
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
                loading={saving}
            />

        </div>
    );
}


export default AddProduct;