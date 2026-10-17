import { useState } from "react";

const API_URL = "http://localhost:8000/api/products/";

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body
                ? { "Content-Type": "application/json" }
                : {}),
            ...options.headers,
        },
    });

    if (!response.ok) {
        let message = `HTTP ${response.status}`;

        try {
            const data = await response.json();
            message = data.detail || JSON.stringify(data);
        } catch {
            // پاسخ ممکن است JSON نباشد
        }

        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    if (response.status === 204) return null;

    return response.json();
}

async function retryRequest(url, options = {}, retries = 2) {
    let attempt = 0;

    while (true) {
        try {
            return await apiRequest(url, options);
        } catch (error) {
            const retryable =
                error instanceof TypeError ||
                error.status === 408 ||
                error.status === 429 ||
                error.status >= 500;

            if (!retryable || attempt >= retries) {
                throw error;
            }

            attempt += 1;

            await new Promise((resolve) =>
                setTimeout(resolve, 500 * 2 ** (attempt - 1))
            );
        }
    }
}

function normalizeProducts(data) {
    return Array.isArray(data) ? data : data.results || [];
}

export default function IntegrationTest() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [createdProductId, setCreatedProductId] = useState(null);

    function log(message, success = true) {
        setLogs((previous) => [
            ...previous,
            {
                id: `${Date.now()}-${Math.random()}`,
                message,
                success,
            },
        ]);
    }

    async function refreshProducts() {
        const data = await retryRequest(API_URL);
        const items = normalizeProducts(data);

        // به‌روزرسانی فهرست محلی صفحه پس از دریافت پاسخ سرور
        setProducts(items);

        return items;
    }

    async function runIntegrationTest() {
        setLoading(true);
        setLogs([]);
        setCreatedProductId(null);

        let productId = null;

        try {
            log("مرحله ۱: اتصال به Django و دریافت محصولات");

            await refreshProducts();

            log("اتصال API و دریافت فهرست موفق بود.");

            const key = crypto.randomUUID();

            const payload = {
                name: `Integration Test ${key.slice(0, 8)}`,
                price: "1500.00",
                category: "Testing",
            };

            log("مرحله ۲: ایجاد محصول");

            const created = await retryRequest(
                API_URL,
                {
                    method: "POST",
                    headers: {
                        "Idempotency-Key": key,
                    },
                    body: JSON.stringify(payload),
                }
            );

            productId = created.id;
            setCreatedProductId(productId);

            log(`محصول با شناسه ${productId} ایجاد شد.`);

            log("مرحله ۳: ارسال مجدد درخواست با همان کلید");

            const retried = await retryRequest(
                API_URL,
                {
                    method: "POST",
                    headers: {
                        "Idempotency-Key": key,
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (retried.id !== productId) {
                throw new Error(
                    "Retry محصول دیگری ایجاد کرده است."
                );
            }

            log("Retry موفق بود؛ محصول تکراری ایجاد نشد.");

            log("مرحله ۴: ویرایش محصول");

            const updated = await retryRequest(
                `${API_URL}${productId}/`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        name: `${payload.name} Updated`,
                    }),
                }
            );

            if (!updated.name.endsWith("Updated")) {
                throw new Error("ویرایش محصول تأیید نشد.");
            }

            log("ویرایش محصول موفق بود.");

            log("مرحله ۵: دریافت مجدد فهرست برای هماهنگی وضعیت");

            const refreshed = await refreshProducts();

            const found = refreshed.find(
                (product) => product.id === productId
            );

            if (!found || !found.name.endsWith("Updated")) {
                throw new Error(
                    "محصول ویرایش‌شده در فهرست جدید پیدا نشد."
                );
            }

            log("فهرست با اطلاعات جدید سرور هماهنگ شد.");

            log("مرحله ۶: حذف محصول");

            await retryRequest(`${API_URL}${productId}/`, {
                method: "DELETE",
            });

            log("حذف محصول موفق بود.");

            log("مرحله ۷: بررسی حذف از سرور");

            const finalProducts = await refreshProducts();

            if (
                finalProducts.some(
                    (product) => product.id === productId
                )
            ) {
                throw new Error(
                    "محصول حذف‌شده هنوز در فهرست سرور وجود دارد."
                );
            }

            setCreatedProductId(null);
            log("تست یکپارچه با موفقیت پایان یافت.");
        } catch (error) {
            log(`خطا: ${error.message}`, false);

            // در صورت شکست تست، محصول آزمایشی را خودکار حذف نمی‌کنیم
            // تا امکان بررسی آن در سرور وجود داشته باشد.
        } finally {
            setLoading(false);
        }
    }

    return (
        <main style={{ padding: 24, direction: "rtl" }}>
            <h1>تست یکپارچه React و Django</h1>

            <button
                onClick={runIntegrationTest}
                disabled={loading}
            >
                {loading ? "در حال اجرای تست..." : "اجرای تست یکپارچه"}
            </button>

            {createdProductId !== null && (
                <p>
                    شناسه محصول آزمایشی: {createdProductId}
                </p>
            )}

            <h2>گزارش تست</h2>

            {logs.length === 0 ? (
                <p>هنوز تستی اجرا نشده است.</p>
            ) : (
                <ol>
                    {logs.map((item) => (
                        <li
                            key={item.id}
                            style={{
                                color: item.success
                                    ? "green"
                                    : "crimson",
                                marginBottom: 8,
                            }}
                        >
                            {item.message}
                        </li>
                    ))}
                </ol>
            )}

            <h2>محصولات دریافت‌شده از سرور</h2>

            {products.length === 0 ? (
                <p>محصولی در فهرست نیست.</p>
            ) : (
                <ul>
                    {products.map((product) => (
                        <li key={product.id}>
                            {product.name} — {product.price}
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}