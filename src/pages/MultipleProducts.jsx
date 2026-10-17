import { useState } from "react";
import { Link } from "react-router-dom";

import useQueries from "../hooks/useQueries";
import { getProduct } from "../api/productsApi";

function MultipleProducts() {
    const [ids, setIds] = useState([2, 3]);
    const [newId, setNewId] = useState("");

    const queries = ids.map((id) => ({
        queryKey: ["products", Number(id)],

        queryFn: getProduct,

        args: [Number(id)],

        enabled:
            Number.isInteger(Number(id)) &&
            Number(id) > 0,

        options: {
            staleTime: 30_000,
            cacheTime: 300_000,
            retry: 2,
            retryDelay: 500,
        },
    }));

    const results = useQueries(queries);

    function addProductId() {
        const id = Number(newId);

        if (!Number.isInteger(id) || id <= 0) {
            return;
        }

        setIds((previous) => {
            if (previous.includes(id)) {
                return previous;
            }

            return [...previous, id];
        });

        setNewId("");
    }

    function removeProductId(id) {
        setIds((previous) =>
            previous.filter(
                (item) => item !== id
            )
        );
    }

    return (
        <main>
            <h1>محصولات با Query پویا</h1>

            <div>
                <input
                    type="number"
                    min="1"
                    value={newId}
                    onChange={(event) =>
                        setNewId(
                            event.target.value
                        )
                    }
                    placeholder="شناسه محصول"
                />

                <button
                    onClick={addProductId}
                >
                    افزودن Query
                </button>
            </div>

            <hr />

            {results.map((result, index) => {
                const id = ids[index];

                return (
                    <article
                        key={JSON.stringify(
                            result.queryKey
                        )}
                    >
                        <h2>
                            محصول شماره {id}
                        </h2>

                        {result.loading && (
                            <p>
                                در حال دریافت...
                            </p>
                        )}

                        {result.error && (
                            <div>
                                <p>
                                    خطا:{" "}
                                    {
                                        result.error
                                            .message
                                    }
                                </p>

                                <button
                                    onClick={
                                        result.refetch
                                    }
                                >
                                    تلاش دوباره
                                </button>
                            </div>
                        )}

                        {result.cancelled && (
                            <p>
                                درخواست لغو شد.
                            </p>
                        )}

                        {result.data && (
                            <>
                                <p>
                                    نام:{" "}
                                    {
                                        result.data
                                            .name
                                    }
                                </p>

                                <p>
                                    قیمت:{" "}
                                    {
                                        result.data
                                            .price
                                    }
                                </p>

                                <p>
                                    دسته‌بندی:{" "}
                                    {
                                        result.data
                                            .category
                                    }
                                </p>

                                <button
                                    onClick={
                                        result.refetch
                                    }
                                >
                                    دریافت مجدد
                                </button>

                                <button
                                    onClick={() =>
                                        result.cancel()
                                    }
                                >
                                    لغو درخواست
                                </button>

                                <br />

                                <Link
                                    to={`/products/${id}`}
                                >
                                    مشاهده جزئیات
                                </Link>
                            </>
                        )}

                        <br />

                        <button
                            onClick={() =>
                                removeProductId(id)
                            }
                        >
                            حذف Query
                        </button>

                        <hr />
                    </article>
                );
            })}
        </main>
    );
}

export default MultipleProducts;