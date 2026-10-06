import { useState } from "react";

function ProductForm({onSubmit, initialData = { name: "", price: "" }, loading = false}) {

    const [name, setName] = useState(initialData.name);
    const [price, setPrice] = useState(initialData.price);

    async function handleSubmit(event) {
        event.preventDefault();
        await onSubmit({name, price: Number(price)});
    }

    return (

        <form onSubmit={handleSubmit}>

            <div>
                <label>Name</label>
                <input value={name} onChange={(event) => setName(event.target.value)} disabled={loading}/>
            </div>

            <div>
                <label>Price</label>
                <input type="number" value={price} onChange={(event) => setPrice(event.target.value)} disabled={loading}/>
            </div>

            <button type="submit" disabled={loading} >
                {loading ? "Saving..." : "Save Product"}
            </button>

        </form>
    );
}
export default ProductForm;