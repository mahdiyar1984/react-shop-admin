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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


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

            setLoading(true);
            setError("");

            const response = await fetch(
                "http://localhost:8000/api/products/",
                {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
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
            setLoading(false);
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
            />

        </div>
    );
}


export default AddProduct;