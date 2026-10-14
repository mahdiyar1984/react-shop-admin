
import { Link, useParams } from "react-router-dom";
import useQuery from "../hooks/useQuery";
import {
    getProducts,
    getProduct,
} from "../api/productsApi";

function ProductDetail() {
    const { id } = useParams();
    const productId = Number(id);

    // Query اول: دریافت فهرست محصولات
    const productsQuery = useQuery(
        ["products"],
        getProducts,
        {
            staleTime: 30_000,
            cacheTime: 300_000,
            retry: 2,
            retryDelay: 500,
        }
    );

    // Query دوم: دریافت جزئیات محصول
    const productQuery = useQuery(
        ["products", productId],
        getProduct,
        productId,
        {
            enabled:
                Number.isInteger(productId) &&
                productId > 0,
            staleTime: 30_000,
            cacheTime: 300_000,
            retry: 2,
            retryDelay: 500,
        }
    );

    const product = productQuery.data;
    const products = productsQuery.data || [];

    // این بخش به نتیجه هر دو Query وابسته است.
    const relatedProducts =
        product && productsQuery.data
            ? products.filter(
                  (item) =>
                      item.category === product.category &&
                      Number(item.id) !== productId
              )
            : [];

    return (
        <main>
            <h1>جزئیات محصول</h1>

            {/* وضعیت Query جزئیات محصول */}
            <section>
                <h2>اطلاعات محصول</h2>

                {productQuery.loading && !product && (
                    <p>در حال دریافت اطلاعات محصول...</p>
                )}

                {productQuery.error && (
                    <div>
                        <p>
                            خطای دریافت محصول:{" "}
                            {productQuery.error.message}
                        </p>

                        <button onClick={productQuery.refetch}>
                            تلاش دوباره
                        </button>
                    </div>
                )}

                {product && (
                    <>
                        <h3>{product.name}</h3>
                        <p>شناسه: {product.id}</p>
                        <p>قیمت: {product.price}</p>
                        <p>دسته‌بندی: {product.category}</p>
                    </>
                )}
            </section>

            <hr />

            {/* وضعیت مستقل Query فهرست محصولات */}
            <section>
                <h2>محصولات هم‌دسته</h2>

                {productsQuery.loading && (
                    <p>در حال دریافت فهرست محصولات...</p>
                )}

                {productsQuery.error && (
                    <div>
                        <p>
                            خطای دریافت فهرست:{" "}
                            {productsQuery.error.message}
                        </p>

                        <button onClick={productsQuery.refetch}>
                            تلاش دوباره
                        </button>
                    </div>
                )}

                {product &&
                    productsQuery.data &&
                    relatedProducts.length === 0 && (
                        <p>
                            محصول دیگری در این دسته‌بندی پیدا نشد.
                        </p>
                    )}

                {product && productsQuery.data && (
                    <ul>
                        {relatedProducts.map((item) => (
                            <li key={item.id}>
                                <Link to={`/products/${item.id}`}>
                                    {item.name}
                                </Link>
                                {" — "}
                                {item.price}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <p>
                <Link to="/products">
                    بازگشت به فهرست محصولات
                </Link>
            </p>
        </main>
    );
}

export default ProductDetail;
