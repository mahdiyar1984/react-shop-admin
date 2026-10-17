import {
    useCallback,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import ProductForm from "../components/ProductForm";
import LoadingState from "../components/LoadingState";
import ApiError from "../components/ApiError";
import MutationError from "../components/MutationError";

import useQuery from "../hooks/useQuery";
import useProductMutations from "../hooks/useProductMutations";

import {
    useQueryClient,
} from "../query/QueryClientContext";

import {
    getProduct,
} from "../api/productsApi";

function EditProduct() {
    const { id } = useParams();
    const navigate = useNavigate();

    const queryClient = useQueryClient();

    const {
        data: product,
        loading,
        error,
        refetch,
    } = useQuery(
        ["product", id],
        getProduct,
        id
    );

    const {
        update,
        updateMutation,
    } = useProductMutations(queryClient);

    const handleUpdate = useCallback(
        async (values) => {
            await update(id, values);

            navigate(`/products/${id}`);
        },
        [id, update, navigate]
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
            </main>
        );
    }

    return (
        <main>
            <h1>ویرایش محصول</h1>

            <MutationError
                error={updateMutation.error}
                onDismiss={updateMutation.reset}
            />

            <ProductForm
                initialValues={product}
                onSubmit={handleUpdate}
                submitLabel="ذخیره تغییرات"
                loading={
                    updateMutation.loading
                }
                error={null}
            />

            <button
                type="button"
                onClick={() =>
                    navigate(
                        `/products/${id}`
                    )
                }
                disabled={
                    updateMutation.loading
                }
            >
                انصراف
            </button>
        </main>
    );
}

export default EditProduct;