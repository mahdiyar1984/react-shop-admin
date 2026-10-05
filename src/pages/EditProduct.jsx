import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProductForm from "../components/ProductForm";
import useFetch from "../hooks/useFetch";
import useApi from "../hooks/useApi";
import { getProduct, updateProduct } from "../api/productsApi";


function EditProduct({ onUpdateProduct }) {

    const { id } = useParams();
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [actionError, setActionError] = useState("");
    const [productForm, setProductForm] = useState({ name: "", price: "", category: "" });
    const { request, loading, error } = useApi();

    async function fetchProduct() {

        try {
            const data = await getProduct(request, id);
            setProductForm({ name: data.name, price: data.price, category: data.category });

        } catch (error) {
            console.log(error);
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
            const data = await updateProduct(request, id, productForm);
            onUpdateProduct(data);
            navigate(`/products/${id}`);

        } catch (error) {
            console.log(error);
        }
    }

    if (loading) {
        return (
            <p>
                Loading product...
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