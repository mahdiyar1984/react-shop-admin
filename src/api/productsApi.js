const API_URL = "http://localhost:8000/api/products";

export async function getProducts(request, signal) {
    return request(`${API_URL}/`, { signal });
}

export async function getProduct(request, id, signal) {
    return request(`${API_URL}/${id}/`, { signal });
}

export async function createProduct(request, product, signal) {
    return request(`${API_URL}/`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product),
            signal
        }
    );
}

export async function updateProduct(request, id, product, signal) {
    return request(`${API_URL}/${id}/`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product),
            signal
        }
    );
}

export async function deleteProduct(request, id, signal) {
    return request(`${API_URL}/${id}/`,
        {
            method: "DELETE",
            signal
        }
    );
}