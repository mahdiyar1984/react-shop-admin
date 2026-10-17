import {
    memo,
    useCallback,
    useMemo,
} from "react";

import ProductCard from "./ProductCard";

function ProductList({ products = [], onDelete, deletingId = null, }) {
    const visibleProducts = useMemo(
        () => products.filter(Boolean),
        [products]
    );

    const handleDelete = useCallback(
        (id) => {onDelete(id);},
        [onDelete]
    );

    if (visibleProducts.length === 0) {
        return (
            <div className="empty-state">
                <p>محصولی برای نمایش وجود ندارد.</p>
            </div>
        );
    }

    return (
        <section className="product-list">
            {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} onDelete={handleDelete} deleting={deletingId === product.id} />
            ))}
        </section>
    );
}

export default memo(ProductList);