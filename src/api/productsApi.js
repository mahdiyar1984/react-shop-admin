const API_URL = "http://localhost:8000/api/products";

export async function getProducts(request) {

    return request(
        `${API_URL}/`
    );
}

export async function getProduct(request, id) {

    return request(
        `${API_URL}/${id}/`
    );
}

export async function createProduct(request, product) {

    return request(
        `${API_URL}/`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(product)
        }
    );
}

export async function updateProduct(request, id, product) {

    return request(
        `${API_URL}/${id}/`,
        {
            method: "PATCH",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(product)
        }
    );
}

export async function deleteProduct(request, id) {

    return request(
        `${API_URL}/${id}/`,
        {
            method: "DELETE"
        }
    );
}