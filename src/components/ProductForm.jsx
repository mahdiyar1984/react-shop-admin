import { useState } from "react";

function ProductForm({ onAddProduct }) {

    const [productForm, setProductForm] = useState({
        name: "",
        price: "",
        category: ""
    });


    function handleChange(event) {
        const { name, value } = event.target;
        setProductForm({
            ...productForm,
            [name]: value
        });
    }


    function handleSubmit(event) {
        event.preventDefault();
        onAddProduct(productForm);
        setProductForm({
            name: "",
            price: "",
            category: ""
        });
    }


    return (

        <div>

            <h2>
                Add Product
            </h2>

            <form onSubmit={handleSubmit}>

                <input
                    type="text"
                    name="name"
                    placeholder="Product Name"
                    value={productForm.title}
                    onChange={handleChange}
                />

                <input
                    type="number"
                    name="price"
                    placeholder="Price"
                    value={productForm.price}
                    onChange={handleChange}
                />

                <input
                    type="text"
                    name="category"
                    placeholder="Category"
                    value={productForm.category}
                    onChange={handleChange}
                />

                <button type="submit">
                    Add Product
                </button>

            </form>

        </div>
    );
}

export default ProductForm;