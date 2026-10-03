function ProductForm({productForm, onChange, onSubmit, loading, buttonText = "Save"}) {

    return (
        <form onSubmit={onSubmit}>

            <div>
                <label>
                    Name
                </label>

                <input
                    type="text"
                    name="name"
                    value={productForm.name}
                    onChange={onChange}
                />
            </div>


            <div>
                <label>
                    Price
                </label>

                <input
                    type="number"
                    name="price"
                    value={productForm.price}
                    onChange={onChange}
                />
            </div>


            <div>
                <label>
                    Category
                </label>

                <input
                    type="text"
                    name="category"
                    value={productForm.category}
                    onChange={onChange}
                />
            </div>


            <button
                type="submit"
                disabled={loading}
            >
                {loading
                    ? "Saving..."
                    : buttonText
                }
            </button>


        </form>
    );
}

export default ProductForm;