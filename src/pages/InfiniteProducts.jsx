import useInfiniteQuery from "../hooks/useInfiniteQuery";
import { getProductsPage } from "../api/productsApi";

function InfiniteProducts() {
    const {
        pages,
        loading,
        error,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        prefetchNextPage,
        cancel,
    } = useInfiniteQuery(
        ["products", "infinite"],
        getProductsPage,
        {
            initialPageParam: 1,

            getNextPageParam: (lastPage) => {
                if (!lastPage?.next) {
                    return undefined;
                }

                const url = new URL(
                    lastPage.next,
                    "http://localhost:8000"
                );

                const nextPage =
                    url.searchParams.get("page");

                return nextPage
                    ? Number(nextPage)
                    : undefined;
            },

            staleTime: 30_000,
            cacheTime: 300_000,
            prefetch: true,
        }
    );

    const products = pages.flatMap(
        (page) => page.results || []
    );

    if (loading && products.length === 0) {
        return (
            <main>
                <p>در حال دریافت محصولات...</p>

                <button onClick={cancel}>
                    لغو درخواست
                </button>
            </main>
        );
    }

    if (error && products.length === 0) {
        return (
            <main>
                <p>خطا: {error.message}</p>

                <button
                    onClick={() => window.location.reload()}
                >
                    تلاش دوباره
                </button>
            </main>
        );
    }

    return (
        <main>
            <h1>محصولات با Infinite Query</h1>

            <p>
                تعداد محصولات بارگذاری‌شده:{" "}
                {products.length}
            </p>

            {products.map((product) => (
                <article key={product.id}>
                    <h2>{product.name}</h2>
                    <p>قیمت: {product.price}</p>
                    <p>
                        دسته‌بندی: {product.category}
                    </p>
                    <hr />
                </article>
            ))}

            {error && (
                <p>
                    دریافت صفحه بعدی ناموفق بود:{" "}
                    {error.message}
                </p>
            )}

            {isFetchingNextPage && (
                <p>در حال دریافت صفحه بعدی...</p>
            )}

            {hasNextPage && (
                <button
                    onClick={fetchNextPage}
                    onMouseEnter={prefetchNextPage}
                    onFocus={prefetchNextPage}
                    disabled={isFetchingNextPage}
                >
                    {isFetchingNextPage
                        ? "در حال دریافت..."
                        : "نمایش محصولات بیشتر"}
                </button>
            )}

            {!hasNextPage && products.length > 0 && (
                <p>همه محصولات نمایش داده شدند.</p>
            )}
        </main>
    );
}

export default InfiniteProducts;