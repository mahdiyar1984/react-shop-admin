import {
    memo,
    useEffect,
    useState,
} from "react";

function ProductForm({
    initialValues = null,
    onSubmit,
    submitLabel = "ذخیره محصول",
    loading = false,
    error = null,
}) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("");
    const [formError, setFormError] = useState("");

    useEffect(() => {
        setName(initialValues?.name ?? "");
        setPrice(
            initialValues?.price !== undefined &&
            initialValues?.price !== null
                ? String(initialValues.price)
                : ""
        );
        setCategory(initialValues?.category ?? "");
        setFormError("");
    }, [
        initialValues?.name,
        initialValues?.price,
        initialValues?.category,
    ]);

    async function handleSubmit(event) {
        event.preventDefault();

        if (loading) {
            return;
        }

        setFormError("");

        const cleanName = name.trim();
        const cleanCategory = category.trim();
        const numericPrice = Number(price);

        if (!cleanName) {
            setFormError(
                "نام محصول را وارد کنید."
            );
            return;
        }

        if (
            price === "" ||
            !Number.isFinite(numericPrice) ||
            numericPrice < 0
        ) {
            setFormError(
                "قیمت محصول معتبر نیست."
            );
            return;
        }

        if (!cleanCategory) {
            setFormError(
                "دسته‌بندی را وارد کنید."
            );
            return;
        }

        try {
            await onSubmit({
                name: cleanName,
                price: numericPrice,
                category: cleanCategory,
            });
        } catch {
            // خطا توسط کامپوننت والد مدیریت می‌شود.
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="product-form"
        >
            <div>
                <label htmlFor="product-name">
                    نام محصول
                </label>

                <input
                    id="product-name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                        setName(event.target.value)
                    }
                    disabled={loading}
                    autoComplete="off"
                />
            </div>

            <div>
                <label htmlFor="product-price">
                    قیمت
                </label>

                <input
                    id="product-price"
                    type="number"
                    min="0"
                    step="any"
                    value={price}
                    onChange={(event) =>
                        setPrice(event.target.value)
                    }
                    disabled={loading}
                />
            </div>

            <div>
                <label htmlFor="product-category">
                    دسته‌بندی
                </label>

                <input
                    id="product-category"
                    type="text"
                    value={category}
                    onChange={(event) =>
                        setCategory(event.target.value)
                    }
                    disabled={loading}
                />
            </div>

            {formError && (
                <p
                    className="form-error"
                    role="alert"
                >
                    {formError}
                </p>
            )}

            {error && (
                <p
                    className="form-error"
                    role="alert"
                >
                    {error.message ||
                        "عملیات ناموفق بود."}
                </p>
            )}

            <button
                type="submit"
                disabled={loading}
            >
                {loading
                    ? "در حال ذخیره..."
                    : submitLabel}
            </button>
        </form>
    );
}

export default memo(ProductForm);