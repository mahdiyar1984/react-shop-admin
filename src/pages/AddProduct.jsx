import ProductForm from "../components/ProductForm";

function AddProduct({ onAddProduct }) {

    return (
        <div>

            <h1>
                Add Product
            </h1>

            <ProductForm
                onAddProduct={onAddProduct}
            />

        </div>
    );
}

export default AddProduct;