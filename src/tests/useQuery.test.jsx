import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import {
    cleanup,
    renderHook,
    waitFor,
    act,
} from "@testing-library/react";

import useQuery from "../hooks/useQuery";
import { QueryClientProvider } from "../query/QueryClientContext";

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

function wrapper({ children }) {
    return (
        <QueryClientProvider>
            {children}
        </QueryClientProvider>
    );
}

describe("useQuery", () => {
    it("داده موفق Query را نمایش می‌دهد", async () => {
        const products = [
            { id: 1, name: "Laptop" },
            { id: 2, name: "Mouse" },
        ];

        const queryFunction = vi.fn(
            async () => products
        );

        const { result } = renderHook(
            () =>
                useQuery(
                    ["test-products"],
                    queryFunction,
                    { retry: false }
                ),
            { wrapper }
        );

        await waitFor(() => {
            expect(result.current.data).toEqual(products);
        });

        expect(result.current.error).toBeNull();
    });

    it("خطای Query را نمایش می‌دهد", async () => {
        const queryFunction = vi.fn(async () => {
            throw new Error("خطای آزمایشی");
        });

        const { result } = renderHook(
            () =>
                useQuery(
                    ["test-error"],
                    queryFunction,
                    { retry: false }
                ),
            { wrapper }
        );

        await waitFor(() => {
            expect(result.current.error?.message).toBe(
                "خطای آزمایشی"
            );
        });
    });

    it("با refetch داده را دوباره دریافت می‌کند", async () => {
        const queryFunction = vi.fn()
            .mockResolvedValueOnce([{ id: 1, name: "Old" }])
            .mockResolvedValueOnce([{ id: 1, name: "New" }]);

        const { result } = renderHook(
            () =>
                useQuery(
                    ["test-refetch"],
                    queryFunction,
                    { retry: false }
                ),
            { wrapper }
        );

        await waitFor(() => {
            expect(result.current.data?.[0]?.name).toBe("Old");
        });

        await act(async () => {
            await result.current.refetch();
        });

        await waitFor(() => {
            expect(result.current.data?.[0]?.name).toBe("New");
        });

        expect(queryFunction).toHaveBeenCalledTimes(2);
    });

    it("با enabled=false درخواست را اجرا نمی‌کند", async () => {
        const queryFunction = vi.fn(
            async () => [{ id: 1 }]
        );

        renderHook(
            () =>
                useQuery(
                    ["disabled-query"],
                    queryFunction,
                    { enabled: false }
                ),
            { wrapper }
        );

        await new Promise((resolve) =>
            setTimeout(resolve, 50)
        );

        expect(queryFunction).not.toHaveBeenCalled();
    });
});