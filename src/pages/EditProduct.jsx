import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import ProductForm from "../components/ProductForm";


function EditProduct({ onUpdateProduct }) {

    const { id } = useParams();
    const navigate = useNavigate();
    const [productForm, setProductForm] = useState({
        name: "",
        price: "",
        category: ""
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function fetchProduct() {

        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `http://localhost:8000/api/products/${id}/`
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to fetch product"
                );
            }


            const data = await response.json();

            setProductForm({
                name: data.name,
                price: data.price,
                category: data.category
            });


        } catch (error) {
            setError(error.message);

        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        fetchProduct();
    }, [id]);


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
                `http://localhost:8000/api/products/${id}/`,
                {
                    method: "PATCH",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(productForm)
                }
            );


            if (!response.ok) {
                throw new Error(
                    "Failed to update product"
                );
            }

            const data = await response.json();
            onUpdateProduct(data);
            navigate(`/products/${id}`);


        } catch (error) {
            setError(error.message);

        } finally {
            setLoading(false);
        }
    }


    if (loading) {
        return (
            <p>
                Loading...
            </p>
        );
    }

    return (

        <div>

            <h1>
                Edit Product
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
                buttonText="Update Product"
            />

        </div>
    );
}


export default EditProduct;