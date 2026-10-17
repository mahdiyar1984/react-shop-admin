const API_URL = "http://localhost:8000/api/products/";

export async function getProducts(request, signal) {
    return request(API_URL, { signal });
}

export async function getProduct(request, id, signal) {
    return request(`${API_URL}${id}/`, {
        signal
    });
}

export async function createProduct(request, product, idempotencyKey, signal) {
    return request(API_URL, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey, },
        body: JSON.stringify(product),
        signal,
    });
}

export async function updateProduct(request, id, product, signal) {
    return request(`${API_URL}${id}/`, {
        method: "PATCH",
        body: JSON.stringify(product),
        signal,
    });
}

export async function deleteProduct(request, id, signal) {
    return request(`${API_URL}${id}/`, {
        method: "DELETE",
        signal,
    });
}

export async function getProductsPage(request, page, signal) {
    return request(`${API_URL}?page=${page}`, {
        signal,
    });
}