import {
    useCallback,
} from "react";

import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";

import useQuery from "../hooks/useQuery";
import useProductMutations from "../hooks/useProductMutations";

import {
    useQueryClient,
} from "../query/QueryClientContext";

import {
    getProduct,
} from "../api/productsApi";

import LoadingState from "../components/LoadingState";
import ApiError from "../components/ApiError";
import MutationError from "../components/MutationError";

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const queryClient = useQueryClient();

    const {
        data: product,
        loading,
        fetching,
        error,
        refetch,
    } = useQuery(
        ["product", id],
        getProduct,
        id
    );

    const {
        remove,
        deleteMutation,
    } = useProductMutations(queryClient);

    const handleDelete = useCallback(
        async () => {
            const confirmed = window.confirm(
                "آیا از حذف این محصول مطمئن هستید؟"
            );

            if (!confirmed) {
                return;
            }

            try {
                await remove(id);

                navigate("/products");
            } catch {
                // خطا در Mutation نمایش داده می‌شود.
            }
        },
        [id, remove, navigate]
    );

    if (!product && loading) {
        return (
            <main>
                <LoadingState
                    message="در حال دریافت محصول..."
                />
            </main>
        );
    }

    if (error && !product) {
        return (
            <main>
                <ApiError
                    error={error}
                    onRetry={refetch}
                    title="دریافت محصول ناموفق بود"
                />
            </main>
        );
    }

    if (!product) {
        return (
            <main>
                <h1>محصول پیدا نشد</h1>

                <Link to="/products">
                    بازگشت به محصولات
                </Link>
            </main>
        );
    }

    return (
        <main>
            <header>
                <h1>{product.name}</h1>

                {fetching && (
                    <small>
                        در حال به‌روزرسانی...
                    </small>
                )}
            </header>

            <section>
                <p>
                    قیمت: {product.price}
                </p>

                <p>
                    دسته‌بندی: {product.category}
                </p>
            </section>

            <MutationError
                error={deleteMutation.error}
                onDismiss={deleteMutation.reset}
            />

            <div>
                <Link
                    to={`/products/${id}/edit`}
                >
                    ویرایش
                </Link>

                {" "}

                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={
                        deleteMutation.loading
                    }
                >
                    {deleteMutation.loading
                        ? "در حال حذف..."
                        : "حذف محصول"}
                </button>

                {" "}

                <Link to="/products">
                    بازگشت
                </Link>
            </div>
        </main>
    );
}

export default ProductDetail;