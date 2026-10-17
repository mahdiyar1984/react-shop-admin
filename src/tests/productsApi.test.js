import { describe, it, expect, vi } from "vitest";

import {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsPage,
} from "../api/productsApi";

describe("productsApi", () => {
    const request = vi.fn();

    const product = {
        name: "Laptop",
        price: 25000,
        category: "Electronics",
    };

    it("محصولات را دریافت می‌کند", async () => {
        request.mockResolvedValueOnce([]);

        await getProducts(request);

        expect(request).toHaveBeenCalledWith(
            "http://localhost:8000/api/products/",
            { signal: undefined }
        );
    });

    it("یک محصول را با شناسه دریافت می‌کند", async () => {
        request.mockResolvedValueOnce(product);

        await getProduct(request, 5);

        expect(request).toHaveBeenCalledWith(
            "http://localhost:8000/api/products/5/",
            { signal: undefined }
        );
    });

    it("محصول جدید را با Idempotency-Key ایجاد می‌کند", async () => {
        request.mockResolvedValueOnce({
            id: 10,
            ...product,
        });

        await createProduct(
            request,
            product,
            "test-idempotency-key"
        );

        expect(request).toHaveBeenCalledWith(
            "http://localhost:8000/api/products/",
            {
                method: "POST",
                headers: {
                    "Idempotency-Key": "test-idempotency-key",
                },
                body: JSON.stringify(product),
                signal: undefined,
            }
        );
    });

    it("محصول را با PATCH ویرایش می‌کند", async () => {
        request.mockResolvedValueOnce({
            id: 5,
            ...product,
        });

        await updateProduct(request, 5, product);

        expect(request).toHaveBeenCalledWith(
            "http://localhost:8000/api/products/5/",
            {
                method: "PATCH",
                body: JSON.stringify(product),
                signal: undefined,
            }
        );
    });

    it("محصول را حذف می‌کند", async () => {
        request.mockResolvedValueOnce(null);

        await deleteProduct(request, 5);

        expect(request).toHaveBeenCalledWith(
            "http://localhost:8000/api/products/5/",
            {
                method: "DELETE",
                signal: undefined,
            }
        );
    });

    it("صفحه مشخصی از محصولات را دریافت می‌کند", async () => {
        request.mockResolvedValueOnce({
            results: [],
        });

        await getProductsPage(request, 2);

        expect(request).toHaveBeenCalledWith(
            "http://localhost:8000/api/products/?page=2",
            { signal: undefined }
        );
    });
});