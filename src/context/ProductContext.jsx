// src/context/ProductContext.jsx

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
} from "react";

import useQuery from "../hooks/useQuery";
import useMutation from "../hooks/useMutation";

import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../api/productsApi";

import { useQueryClient } from "../query/QueryClientContext";

const ProductContext = createContext(null);
const PRODUCTS_STALE_TIME = 30_000;
const PRODUCTS_CACHE_TIME = 300_000;

export const PRODUCTS_QUERY_KEY = ["products"];

export const INFINITE_PRODUCTS_QUERY_KEY = [
    "products",
    "infinite",
];

const mutationQueues = new Map();

function productKey(id) {
    return ["products", Number(id)];
}

function isAbortError(error) {
    return (
        error?.name === "AbortError" ||
        error?.name === "CanceledError"
    );
}

function enqueueMutation(key, task) {
    const previous =
        mutationQueues.get(key) || Promise.resolve();

    const current = previous
        .catch(() => { })
        .then(task);

    mutationQueues.set(key, current);

    return current.finally(() => {
        if (mutationQueues.get(key) === current) {
            mutationQueues.delete(key);
        }
    });
}

function getData(queryClient, key) {
    return queryClient.getQueryState(key)?.data;
}

function updateProductInArray(products, id, updater) {
    if (!Array.isArray(products)) {
        return products;
    }

    return products.map((product) =>
        Number(product.id) === Number(id)
            ? updater(product)
            : product
    );
}

function removeProductFromArray(products, id) {
    if (!Array.isArray(products)) {
        return products;
    }

    return products.filter(
        (product) => Number(product.id) !== Number(id)
    );
}

function updateProductInInfiniteData(data, id, updater) {
    if (!data || !Array.isArray(data.pages)) {
        return data;
    }

    return {
        ...data,
        pages: data.pages.map((page) => {
            if (Array.isArray(page)) {
                return updateProductInArray(
                    page,
                    id,
                    updater
                );
            }

            if (Array.isArray(page?.results)) {
                return {
                    ...page,
                    results: updateProductInArray(
                        page.results,
                        id,
                        updater
                    ),
                };
            }

            return page;
        }),
    };
}

function removeProductFromInfiniteData(data, id) {
    if (!data || !Array.isArray(data.pages)) {
        return data;
    }

    return {
        ...data,
        pages: data.pages.map((page) => {
            if (Array.isArray(page)) {
                return removeProductFromArray(page, id);
            }

            if (Array.isArray(page?.results)) {
                return {
                    ...page,
                    results: removeProductFromArray(
                        page.results,
                        id
                    ),
                };
            }

            return page;
        }),
    };
}

function updateProductCaches(queryClient, product) {
    if (!product?.id) {
        return;
    }

    const id = Number(product.id);

    const list = getData(
        queryClient,
        PRODUCTS_QUERY_KEY
    );

    if (Array.isArray(list)) {
        queryClient.setQueryData(
            PRODUCTS_QUERY_KEY,
            updateProductInArray(list, id, (previous) => ({
                ...previous,
                ...product,
            }))
        );
    }

    const infiniteData = getData(
        queryClient,
        INFINITE_PRODUCTS_QUERY_KEY
    );

    if (infiniteData) {
        queryClient.setQueryData(
            INFINITE_PRODUCTS_QUERY_KEY,
            updateProductInInfiniteData(
                infiniteData,
                id,
                (previous) => ({
                    ...previous,
                    ...product,
                })
            )
        );
    }

    queryClient.setQueryData(
        productKey(id),
        (previous) => ({
            ...(previous || {}),
            ...product,
        })
    );
}

function addProductToCaches(queryClient, product) {
    if (!product?.id) {
        return;
    }

    const id = Number(product.id);

    const list = getData(
        queryClient,
        PRODUCTS_QUERY_KEY
    );

    if (Array.isArray(list)) {
        const exists = list.some(
            (item) => Number(item.id) === id
        );

        queryClient.setQueryData(
            PRODUCTS_QUERY_KEY,
            exists
                ? list.map((item) =>
                    Number(item.id) === id
                        ? { ...item, ...product }
                        : item
                )
                : [product, ...list]
        );
    }

    const infiniteData = getData(
        queryClient,
        INFINITE_PRODUCTS_QUERY_KEY
    );

    if (infiniteData) {
        const exists = infiniteData.pages.some((page) => {
            const items = Array.isArray(page)
                ? page
                : page?.results;

            return (
                Array.isArray(items) &&
                items.some(
                    (item) => Number(item.id) === id
                )
            );
        });

        if (exists) {
            queryClient.setQueryData(
                INFINITE_PRODUCTS_QUERY_KEY,
                updateProductInInfiniteData(
                    infiniteData,
                    id,
                    (previous) => ({
                        ...previous,
                        ...product,
                    })
                )
            );
        }
    }

    queryClient.setQueryData(
        productKey(id),
        product
    );
}

function removeProductFromCaches(queryClient, id) {
    const numericId = Number(id);

    const list = getData(
        queryClient,
        PRODUCTS_QUERY_KEY
    );

    if (Array.isArray(list)) {
        queryClient.setQueryData(
            PRODUCTS_QUERY_KEY,
            removeProductFromArray(list, numericId)
        );
    }

    const infiniteData = getData(
        queryClient,
        INFINITE_PRODUCTS_QUERY_KEY
    );

    if (infiniteData) {
        queryClient.setQueryData(
            INFINITE_PRODUCTS_QUERY_KEY,
            removeProductFromInfiniteData(
                infiniteData,
                numericId
            )
        );
    }

    queryClient.removeQuery(productKey(numericId));
}

async function invalidateCache(queryClient, id) {
    const keys = [
        PRODUCTS_QUERY_KEY,
        INFINITE_PRODUCTS_QUERY_KEY,
    ];

    if (id !== undefined && id !== null) {
        keys.push(productKey(id));
    }

    await Promise.all(
        keys.map(async (key) => {
            try {
                await queryClient.invalidateQuery(key);
            } catch {
                // خطای invalidation نباید خطای اصلی را بپوشاند.
            }
        })
    );
}

export function ProductProvider({ children }) {
    const queryClient = useQueryClient();

    const productsQuery = useQuery(
        PRODUCTS_QUERY_KEY,
        getProducts,
        {
            staleTime: PRODUCTS_STALE_TIME,
            cacheTime: PRODUCTS_CACHE_TIME,
            retry: 2,
            retryDelay: 500,
        }
    );

    const createMutation = useMutation(createProduct);
    const updateMutation = useMutation(updateProduct);
    const deleteMutation = useMutation(deleteProduct);

    const addProduct = useCallback(
        async (product) => {
            const temporaryId = -Date.now();

            const idempotencyKey =
                typeof crypto !== "undefined" &&
                    typeof crypto.randomUUID === "function"
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random()
                        .toString(36)
                        .slice(2)}`;

            const temporaryProduct = {
                ...product,
                id: temporaryId,
            };

            const currentList = getData(
                queryClient,
                PRODUCTS_QUERY_KEY
            );

            if (Array.isArray(currentList)) {
                queryClient.setQueryData(
                    PRODUCTS_QUERY_KEY,
                    [temporaryProduct, ...currentList]
                );
            }

            try {
                const createdProduct =
                    await createMutation.executeForKey(
                        temporaryId,
                        product,
                        idempotencyKey
                    );

                const latestList = getData(
                    queryClient,
                    PRODUCTS_QUERY_KEY
                );

                if (Array.isArray(latestList)) {
                    queryClient.setQueryData(
                        PRODUCTS_QUERY_KEY,
                        latestList.filter(
                            (item) =>
                                Number(item.id) !== temporaryId
                        )
                    );
                }

                addProductToCaches(
                    queryClient,
                    createdProduct
                );

                return createdProduct;
            } catch (error) {
                const latestList = getData(
                    queryClient,
                    PRODUCTS_QUERY_KEY
                );

                if (Array.isArray(latestList)) {
                    queryClient.setQueryData(
                        PRODUCTS_QUERY_KEY,
                        latestList.filter(
                            (item) =>
                                Number(item.id) !== temporaryId
                        )
                    );
                }

                await invalidateCache(queryClient);

                throw error;
            }
        },
        [queryClient, createMutation.executeForKey]
    );

    const editProduct = useCallback(
        (id, product) =>
            enqueueMutation(
                `product:${Number(id)}`,
                async () => {
                    const numericId = Number(id);

                    try {
                        const updatedProduct =
                            await updateMutation.executeForKey(
                                numericId,
                                numericId,
                                product
                            );

                        updateProductCaches(
                            queryClient,
                            updatedProduct
                        );

                        return updatedProduct;
                    } catch (error) {
                        console.error(
                            "خطای ویرایش محصول:",
                            error
                        );

                        await invalidateCache(
                            queryClient,
                            numericId
                        );

                        throw error;
                    }
                }
            ),
        [queryClient, updateMutation.executeForKey]
    );

    const removeProduct = useCallback(
        (id) =>
            enqueueMutation(
                `product:${Number(id)}`,
                async () => {
                    const numericId = Number(id);

                    const previousDetail = getData(
                        queryClient,
                        productKey(numericId)
                    );

                    const previousList = getData(
                        queryClient,
                        PRODUCTS_QUERY_KEY
                    );

                    const previousProduct =
                        previousDetail ||
                        (Array.isArray(previousList)
                            ? previousList.find(
                                (item) =>
                                    Number(item.id) ===
                                    numericId
                            )
                            : null);

                    removeProductFromCaches(
                        queryClient,
                        numericId
                    );

                    try {
                        await deleteMutation.executeForKey(
                            numericId,
                            numericId
                        );

                        return numericId;
                    } catch (error) {
                        // حذف ممکن است در سرور انجام شده باشد؛
                        // محصول را صرفاً از روی Snapshot برنمی‌گردانیم.
                        await invalidateCache(
                            queryClient,
                            numericId
                        );

                        throw error;
                    }
                }
            ),
        [queryClient, deleteMutation.executeForKey]
    );

    const cancelMutations = useCallback(() => {
        createMutation.cancelAll();
        updateMutation.cancelAll();
        deleteMutation.cancelAll();
    }, [
        createMutation.cancelAll,
        updateMutation.cancelAll,
        deleteMutation.cancelAll,
    ]);

    const refetch = useCallback(async () => {
        await invalidateCache(queryClient);

        return productsQuery.refetch();
    }, [queryClient, productsQuery.refetch]);

    const value = useMemo(
        () => ({
            products: productsQuery.data ?? [],
            loading: productsQuery.loading,
            error: productsQuery.error,
            refetch,

            addProduct,
            editProduct,
            removeProduct,

            creating: createMutation.loading,
            createError: createMutation.error,
            getCreateStatus: createMutation.getStatus,

            updating: updateMutation.loading,
            updateError: updateMutation.error,
            getUpdateStatus: updateMutation.getStatus,

            deleting: deleteMutation.loading,
            deleteError: deleteMutation.error,
            getDeleteStatus: deleteMutation.getStatus,

            cancelMutations,
        }),
        [
            productsQuery.data,
            productsQuery.loading,
            productsQuery.error,
            refetch,
            addProduct,
            editProduct,
            removeProduct,
            createMutation.loading,
            createMutation.error,
            createMutation.getStatus,
            updateMutation.loading,
            updateMutation.error,
            updateMutation.getStatus,
            deleteMutation.loading,
            deleteMutation.error,
            deleteMutation.getStatus,
            cancelMutations,
        ]
    );

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
}

export function useProducts() {
    const context = useContext(ProductContext);

    if (!context) {
        throw new Error(
            "useProducts باید داخل ProductProvider استفاده شود."
        );
    }

    return context;
}