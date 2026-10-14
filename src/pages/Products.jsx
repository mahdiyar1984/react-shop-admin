
import { Link } from "react-router-dom";
import { useProducts } from "../context/ProductContext";

function Products() {
    const {
        products,
        loading,
        error,
        refetch,
        removeProduct,
        deleting,
        deleteError,
    } = useProducts();

    async function handleDelete(id) {
        if (!window.confirm("آیا از حذف این محصول مطمئن هستید؟")) {
            return;
        }

        try {
            await removeProduct(id);
        } catch {
            // خطا از طریق deleteError نمایش داده می‌شود.
        }
    }

    if (loading && products.length === 0) {
        return (
            <main dir="rtl">
                <p>در حال دریافت محصولات...</p>
            </main>
        );
    }

    if (error && products.length === 0) {
        return (
            <main dir="rtl">
                <p role="alert">خطا در دریافت محصولات: {error}</p>

                <button onClick={() => refetch()}>
                    تلاش مجدد
                </button>
            </main>
        );
    }

    return (
        <main className="products-page" dir="rtl">
            <h1>مدیریت محصولات</h1>

            <Link to="/products/add">افزودن محصول جدید</Link>

            {loading && products.length > 0 && (
                <p>در حال به‌روزرسانی محصولات...</p>
            )}

            {error && products.length > 0 && (
                <div role="alert">
                    <p>به‌روزرسانی ناموفق بود: {error}</p>
                    <button onClick={() => refetch()}>
                        تلاش مجدد
                    </button>
                </div>
            )}

            {deleteError && (
                <p role="alert">خطا در حذف: {deleteError}</p>
            )}

            {products.length === 0 ? (
                <p>محصولی ثبت نشده است.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>شناسه</th>
                            <th>نام محصول</th>
                            <th>قیمت</th>
                            <th>دسته‌بندی</th>
                            <th>عملیات</th>
                        </tr>
                    </thead>

                    <tbody>
                        {products.map(product => (
                            <tr key={product.id}>
                                <td>{product.id}</td>
                                <td>{product.name}</td>
                                <td>{product.price}</td>
                                <td>{product.category}</td>
                                <td>
                                    <Link to={`/products/${product.id}`}>
                                        مشاهده
                                    </Link>
                                    {" | "}
                                    <Link to={`/products/${product.id}/edit`}>
                                        ویرایش
                                    </Link>
                                    {" | "}
                                    <button
                                        disabled={deleting}
                                        onClick={() => handleDelete(product.id)}
                                    >
                                        حذف
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </main>
    );
}

export default Products;
