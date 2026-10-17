import { memo, useCallback } from "react";
import { Link } from "react-router-dom";

function ProductCard({
    product,
    onDelete,
    deleting = false,
}) {
    const handleDelete = useCallback(() => {
        onDelete(product.id);
    }, [onDelete, product.id]);

    return (
        <article className="product-card">
            <h3>{product.name}</h3>

            <p> قیمت: {product.price} </p>

            <p> دسته‌بندی: {product.category} </p>

            <div className="product-card-actions">
                <Link to={`/products/${product.id}`}>مشاهده</Link>
                <Link to={`/products/${product.id}/edit`}>ویرایش</Link>
                <button type="button" onClick={handleDelete} disabled={deleting}>
                    {deleting ? "در حال حذف..." : "حذف"}
                </button>
            </div>
        </article>
    );
}

export default memo(ProductCard);