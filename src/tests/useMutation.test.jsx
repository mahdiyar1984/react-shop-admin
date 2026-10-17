import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import {
    act,
    cleanup,
    renderHook,
    waitFor,
} from "@testing-library/react";

import useMutation from "../hooks/useMutation";
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

describe("useMutation", () => {
    it("نتیجه موفق Mutation را ذخیره می‌کند", async () => {
        const mutationFn = vi.fn(
            async (_request, product) => ({
                id: 1,
                ...product,
            })
        );

        const { result } = renderHook(
            () => useMutation(mutationFn),
            { wrapper }
        );

        let created;

        await act(async () => {
            created = await result.current.mutateAsync({
                name: "Laptop",
                price: 25000,
                category: "Electronics",
            });
        });

        expect(created.id).toBe(1);

        expect(result.current.status).toBe("success");

        expect(result.current.data.name).toBe("Laptop");
    });

    it("خطای Mutation را ذخیره و دوباره پرتاب می‌کند", async () => {
        const mutationFn = vi.fn(async () => {
            throw new Error("خطای ایجاد محصول");
        });

        const { result } = renderHook(
            () => useMutation(mutationFn),
            { wrapper }
        );

        await act(async () => {
            await expect(
                result.current.mutateAsync({ name: "Laptop" })
            ).rejects.toThrow("خطای ایجاد محصول");
        });

        await waitFor(() => {
            expect(result.current.status).toBe("error");
            expect(result.current.error.message).toBe(
                "خطای ایجاد محصول"
            );
        });
    });

    it("reset وضعیت Mutation را پاک می‌کند", async () => {
        const mutationFn = vi.fn(
            async () => ({ id: 1, name: "Laptop" })
        );

        const { result } = renderHook(
            () => useMutation(mutationFn),
            { wrapper }
        );

        await act(async () => {
            await result.current.mutateAsync({});
        });

        act(() => {
            result.current.reset();
        });

        expect(result.current.status).toBe("idle");
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it("دو Mutation هم‌زمان را بدون لغو یکدیگر اجرا می‌کند", async () => {
        const mutationFn = vi.fn(
            async (_request, value) => {
                await new Promise((resolve) =>
                    setTimeout(resolve, value.delay)
                );

                return value.name;
            }
        );

        const { result } = renderHook(
            () => useMutation(mutationFn),
            { wrapper }
        );

        let first;
        let second;

        await act(async () => {
            const firstPromise = result.current.mutateAsync({
                name: "اول",
                delay: 40,
            });

            const secondPromise = result.current.mutateAsync({
                name: "دوم",
                delay: 10,
            });

            [first, second] = await Promise.all([
                firstPromise,
                secondPromise,
            ]);
        });

        expect(first).toBe("اول");
        expect(second).toBe("دوم");
        expect(mutationFn).toHaveBeenCalledTimes(2);
        expect(result.current.data).toBe("دوم");
    });

    it("لغو Mutation سیگنال درخواست HTTP را لغو می‌کند", async () => {
        let receivedSignal;

        vi.stubGlobal(
            "fetch",
            vi.fn((_url, options) => {
                receivedSignal = options.signal;

                return new Promise((_resolve, reject) => {
                    receivedSignal.addEventListener(
                        "abort",
                        () => {
                            const error = new Error("لغو شد");
                            error.name = "AbortError";
                            reject(error);
                        },
                        { once: true }
                    );
                });
            })
        );

        const mutationFn = (request) => request("/test");

        const { result } = renderHook(
            () => useMutation(mutationFn),
            { wrapper }
        );

        let promise;

        act(() => {
            promise = result.current.mutateAsync();
        });

        await waitFor(() => {
            expect(receivedSignal).toBeDefined();
        });

        act(() => {
            result.current.cancel();
        });

        await act(async () => {
            await expect(promise).rejects.toMatchObject({
                name: "AbortError",
            });
        });

        expect(receivedSignal.aborted).toBe(true);
        expect(result.current.cancelled).toBe(true);
    });
});