
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProductForm from "../components/ProductForm";
import { useProducts } from "../context/ProductContext";
import { useQueryClient } from "../query/QueryClientContext";
import { getProduct } from "../api/productsApi";

function EditProduct() {
    const { id } = useParams();
    const productId = Number(id);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        products,
        editProduct,
        updating,
        updateError,
    } = useProducts();

    const [product, setProduct] = useState(null);
    const [loadingProduct, setLoadingProduct] = useState(true);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadProduct() {
            setLoadingProduct(true);
            setLoadError("");

            try {
                const cachedProduct = products.find(
                    item => item.id === productId
                );

                const result =
                    cachedProduct ||
                    queryClient.getQueryData(["products", productId]) ||
                    await queryClient.fetchQuery(
                        ["products", productId],
                        () => getProduct(null, productId),
                        [],
                        { staleTime: 30_000, cacheTime: 300_000 }
                    );

                if (!cancelled) {
                    setProduct(result);
                }
            } catch (err) {
                if (!cancelled) {
                    setLoadError(
                        err?.message || "دریافت محصول ناموفق بود."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingProduct(false);
                }
            }
        }

        loadProduct();

        return () => {
            cancelled = true;
        };
    }, [productId, products, queryClient]);

    async function handleUpdateProduct(data) {
        await editProduct(productId, data);
        navigate("/products");
    }

    if (loadingProduct) {
        return <p dir="rtl">در حال دریافت اطلاعات محصول...</p>;
    }

    if (loadError || !product) {
        return (
            <main dir="rtl">
                <p role="alert">{loadError || "محصول پیدا نشد."}</p>
                <Link to="/products">بازگشت به محصولات</Link>
            </main>
        );
    }

    return (
        <main dir="rtl">
            <h1>ویرایش محصول</h1>

            <ProductForm
                initialData={product}
                onSubmit={handleUpdateProduct}
                loading={updating}
                error={updateError}
                submitText="ذخیره تغییرات"
            />
        </main>
    );
}

export default EditProduct;
