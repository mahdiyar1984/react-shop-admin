import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useQueryClient } from "../query/QueryClientContext";
import { getProducts } from "../api/productsApi";
import useQuery from "../hooks/useQuery";
import useProductMutations from "../hooks/useProductMutations";

import ProductList from "../components/ProductList";

import LoadingState from "../components/LoadingState";
import ApiError from "../components/ApiError";
import MutationError from "../components/MutationError";

function Products() {
    const queryClient = useQueryClient();
    const [deletingId, setDeletingId] = useState(null);
    const { data, loading, fetching, error, refetch } = useQuery(["products"], getProducts);
    const { remove, deleteMutation } = useProductMutations(queryClient);

    const products = useMemo(() => {
        if (Array.isArray(data)) { return data; }
        if (data && Array.isArray(data.results)) { return data.results; }
        return [];
    }, [data]);

    const handleDelete = useCallback(
        async (id) => {
            const confirmed = window.confirm("آیا از حذف این محصول مطمئن هستید؟");

            if (!confirmed) { return; }
            setDeletingId(id);

            try {await remove(id);}
            catch {}
            finally {setDeletingId(null);}
        }, [remove]
    );

    const handleRetry = useCallback(() => {
        refetch();
    }, [refetch]);

    if (!data && loading) {
        return (
            <main>
                <h1>محصولات</h1>
                <LoadingState message="در حال دریافت محصولات..."/>
            </main>
        );
    }

    if (error && !data) {
        return (
            <main>
                <h1>محصولات</h1>
                <ApiError error={error} onRetry={handleRetry} title="دریافت محصولات ناموفق بود" />
            </main>
        );
    }

    return (
        <main>
            <header className="page-header">
                <div>
                    <h1>محصولات</h1>
                    {fetching && (
                        <small>
                            در حال به‌روزرسانی...
                        </small>
                    )}
                </div>
                <Link to="/products/add">افزودن محصول</Link>
            </header>

            <MutationError error={deleteMutation.error} onDismiss={deleteMutation.reset} />
            <ProductList products={products} onDelete={handleDelete} deletingId={deletingId}/>
        </main>
    );
}

export default Products;