
import { useState } from "react";
import { Link } from "react-router-dom";

import useQueries from "../hooks/useQueries";
import useApi from "../hooks/useApi";

const API_URL = "http://localhost:8000/api/products/";

function MultipleProducts() {
    const [ids, setIds] = useState([1, 2, 3]);
    const [newId, setNewId] = useState("");

    const { request } = useApi();

    const queries = ids.map((id) => ({
        queryKey: ["products", Number(id)],
        queryFn: () =>
            request(`${API_URL}${Number(id)}/`),
        args: [],
        enabled: Number.isInteger(Number(id)) && Number(id) > 0,
    }));

    const results = useQueries(queries);

    function addProductId() {
        const id = Number(newId);

        if (!Number.isInteger(id) || id <= 0) return;

        setIds((previous) =>
            previous.includes(id)
                ? previous
                : [...previous, id]
        );

        setNewId("");
    }

    function removeProductId(id) {
        setIds((previous) =>
            previous.filter((item) => item !== id)
        );
    }

    return (
        <main>
            <h1>مدیریت چند Query هم‌زمان</h1>

            <div>
                <input
                    type="number"
                    min="1"
                    value={newId}
                    onChange={(event) =>
                        setNewId(event.target.value)
                    }
                    placeholder="شناسه محصول"
                />

                <button onClick={addProductId}>
                    افزودن محصول
                </button>
            </div>

            <section>
                {results.map((result, index) => {
                    const id = ids[index];

                    return (
                        <article key={result.queryKey}>
                            <h2>محصول شماره {id}</h2>

                            {result.loading && (
                                <p>در حال دریافت اطلاعات...</p>
                            )}

                            {result.error && (
                                <p>
                                    خطا: {result.error.message}
                                </p>
                            )}

                            {result.data && (
                                <>
                                    <p>
                                        نام: {result.data.name}
                                    </p>

                                    <p>
                                        قیمت: {result.data.price}
                                    </p>

                                    <p>
                                        دسته‌بندی:{" "}
                                        {result.data.category}
                                    </p>

                                    <Link to={`/products/${id}`}>
                                        مشاهده جزئیات
                                    </Link>
                                </>
                            )}

                            <button
                                onClick={() =>
                                    removeProductId(id)
                                }
                            >
                                حذف از فهرست
                            </button>
                        </article>
                    );
                })}
            </section>
        </main>
    );
}

export default MultipleProducts;
