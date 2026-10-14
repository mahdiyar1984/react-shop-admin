
import { useEffect, useState } from "react";

function ProductForm({
    initialData = null,
    onSubmit,
    loading = false,
    error = "",
    submitText = "ذخیره محصول",
}) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("");
    const [validationError, setValidationError] = useState("");

    useEffect(() => {
        setName(initialData?.name ?? "");
        setPrice(initialData?.price ?? "");
        setCategory(initialData?.category ?? "");
    }, [initialData]);

    async function handleSubmit(event) {
        event.preventDefault();

        if (loading) return;

        setValidationError("");

        if (!name.trim() || !category.trim() || price === "") {
            setValidationError("تمام فیلدها را تکمیل کنید.");
            return;
        }

        const numericPrice = Number(price);

        if (!Number.isFinite(numericPrice) || numericPrice < 0) {
            setValidationError("قیمت باید عددی معتبر و غیرمنفی باشد.");
            return;
        }

        try {
            await onSubmit({
                name: name.trim(),
                price: numericPrice,
                category: category.trim(),
            });
        } catch {
            // خطا در بخش error نمایش داده می‌شود.
        }
    }

    return (
        <form onSubmit={handleSubmit} aria-busy={loading}>
            <div>
                <label htmlFor="product-name">نام محصول</label>
                <input
                    id="product-name"
                    value={name}
                    onChange={event => setName(event.target.value)}
                    disabled={loading}
                    required
                />
            </div>

            <div>
                <label htmlFor="product-price">قیمت</label>
                <input
                    id="product-price"
                    type="number"
                    min="0"
                    step="any"
                    value={price}
                    onChange={event => setPrice(event.target.value)}
                    disabled={loading}
                    required
                />
            </div>

            <div>
                <label htmlFor="product-category">دسته‌بندی</label>
                <input
                    id="product-category"
                    value={category}
                    onChange={event => setCategory(event.target.value)}
                    disabled={loading}
                    required
                />
            </div>

            {validationError && (
                <p role="alert">{validationError}</p>
            )}

            {error && (
                <p role="alert">خطا در عملیات: {error}</p>
            )}

            <button type="submit" disabled={loading}>
                {loading ? "در حال انجام عملیات..." : submitText}
            </button>
        </form>
    );
}

export default ProductForm;
