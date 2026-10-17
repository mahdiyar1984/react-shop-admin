import { useCallback } from "react";
import useMutation from "./useMutation";
import { createProduct, updateProduct, deleteProduct } from "../api/productsApi";

const PRODUCTS_KEY = ["products"];
const productKey = (id) => ["product", id];
let operationSequence = 0;
const latestOperationByProduct = new Map();
const activeOperationsByProduct = new Map();
const operationTokens = new WeakMap();

function beginProductOperation(variables) {
    const id = String(variables.id);
    const token = ++operationSequence;
    operationTokens.set(variables, token);
    latestOperationByProduct.set(id, token);
    activeOperationsByProduct.set(id, (activeOperationsByProduct.get(id) ?? 0) + 1);
    return token;
}

function isLatestProductOperation(variables) {
    const token = operationTokens.get(variables);
    const latest = latestOperationByProduct.get(String(variables.id));
    return token === latest;
}

function finishProductOperation(variables) {
    const id = String(variables.id);
    const remaining = (activeOperationsByProduct.get(id) ?? 1) - 1;
    if (remaining <= 0) {
        activeOperationsByProduct.delete(id);
        latestOperationByProduct.delete(id);
    }
    else {
        activeOperationsByProduct.set(id, remaining);
    }
}

function updateProductsCache(queryClient, updater) {
    const current = queryClient.getQueryData(PRODUCTS_KEY);
    if (Array.isArray(current)) {
        queryClient.setQueryData(PRODUCTS_KEY, updater(current));
        return true;
    }

    if (current && typeof current === "object" && Array.isArray(current.results)) {
        queryClient.setQueryData(PRODUCTS_KEY, {
            ...current,
            results: updater(current.results),
        });
        return true;
    }
    return false;
}

function invalidateProducts(queryClient) {
    queryClient.invalidateQuery(PRODUCTS_KEY);
}

function invalidateProduct(queryClient, id) {
    queryClient.invalidateQuery(productKey(id));
}

function useProductMutations(queryClient) {
    const createMutation = useMutation(
        (request, product) => createProduct(request, product, crypto.randomUUID()),
        {
            onSuccess: (createdProduct) => {
                const updated = updateProductsCache(queryClient, (products) =>
                    [
                        createdProduct,
                        ...products.filter((item) => item.id !== createdProduct.id),
                    ]
                );
                if (!updated) {
                    invalidateProducts(queryClient);
                }
                queryClient.setQueryData(
                    productKey(createdProduct.id),
                    createdProduct
                );
            },
        }
    );

    const updateMutation = useMutation(
        (request, variables) =>
            updateProduct(
                request,
                variables.id,
                variables.product
            ),
        {
            onMutate: (variables) => {
                beginProductOperation(variables);
            },

            onSuccess: (updatedProduct, variables) => {
                if (!isLatestProductOperation(variables)) {
                    invalidateProducts(queryClient);
                    invalidateProduct(queryClient, variables.id);
                    return;
                }

                queryClient.setQueryData(
                    productKey(variables.id),
                    updatedProduct
                );

                const updated = updateProductsCache(
                    queryClient,
                    (products) =>
                        products.map((item) =>
                            item.id === updatedProduct.id
                                ? updatedProduct
                                : item
                        )
                );

                if (!updated) {
                    invalidateProducts(queryClient);
                }
            },

            onError: (_error, variables) => {
                if (isLatestProductOperation(variables)) {
                    invalidateProducts(queryClient);
                    invalidateProduct(queryClient, variables.id);
                }
            },

            onSettled: (_data, _error, variables) => {
                finishProductOperation(variables);
            },
        }
    );

    const deleteMutation = useMutation(
        (request, variables) =>
            deleteProduct(request, variables.id),
        {
            onMutate: (variables) => {
                beginProductOperation(variables);
            },

            onSuccess: (_result, variables) => {
                if (!isLatestProductOperation(variables)) {
                    invalidateProducts(queryClient);
                    invalidateProduct(queryClient, variables.id);
                    return;
                }

                const id = variables.id;

                const updated = updateProductsCache(
                    queryClient,
                    (products) =>
                        products.filter(
                            (item) => item.id !== id
                        )
                );

                if (!updated) {
                    invalidateProducts(queryClient);
                }

                invalidateProduct(queryClient, id);
            },

            onError: (_error, variables) => {
                if (isLatestProductOperation(variables)) {
                    invalidateProducts(queryClient);
                    invalidateProduct(queryClient, variables.id);
                }
            },

            onSettled: (_data, _error, variables) => {
                finishProductOperation(variables);
            },
        }
    );

    const create = useCallback(
        (product) => createMutation.mutateAsync(product),
        [createMutation.mutateAsync]
    );

    const update = useCallback(
        (id, product) =>
            updateMutation.mutateAsync({
                id,
                product,
            }),
        [updateMutation.mutateAsync]
    );

    const remove = useCallback(
        (id) => deleteMutation.mutateAsync({ id }),
        [deleteMutation.mutateAsync]
    );

    return {
        create,
        update,
        remove,

        createMutation,
        updateMutation,
        deleteMutation,
    };
}

export default useProductMutations;