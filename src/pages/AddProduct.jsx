import {
    useCallback,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import ProductForm from "../components/ProductForm";
import MutationError from "../components/MutationError";

import useProductMutations from "../hooks/useProductMutations";

import {
    useQueryClient,
} from "../query/QueryClientContext";

function AddProduct() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        create,
        createMutation,
    } = useProductMutations(queryClient);

    const handleCreate = useCallback(
        async (product) => {
            const createdProduct =
                await create(product);

            navigate(
                `/products/${createdProduct.id}`
            );
        },
        [create, navigate]
    );

    return (
        <main>
            <h1>افزودن محصول</h1>

            <MutationError
                error={createMutation.error}
                onDismiss={createMutation.reset}
            />

            <ProductForm
                onSubmit={handleCreate}
                submitLabel="ایجاد محصول"
                loading={
                    createMutation.loading
                }
                error={null}
            />

            <button
                type="button"
                onClick={() =>
                    navigate("/products")
                }
                disabled={
                    createMutation.loading
                }
            >
                بازگشت
            </button>
        </main>
    );
}

export default AddProduct;