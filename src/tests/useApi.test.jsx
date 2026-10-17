import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";

import useApi from "../hooks/useApi";

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

describe("useApi", () => {
    it("پاسخ موفق JSON را برمی‌گرداند", async () => {
        const payload = [{ id: 1, name: "Laptop" }];

        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => payload,
            })
        );

        const { result } = renderHook(() => useApi());

        await expect(
            result.current.request("/api/products/")
        ).resolves.toEqual(payload);
    });

    it("درخواست JSON را با Content-Type می‌فرستد", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                status: 201,
                json: async () => ({ id: 1 }),
            })
        );

        const { result } = renderHook(() => useApi());

        await result.current.request("/api/products/", {
            method: "POST",
            body: JSON.stringify({ name: "Laptop" }),
        });

        expect(fetch).toHaveBeenCalledWith(
            "/api/products/",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            })
        );
    });

    it("برای خطای HTTP، Error دارای status پرتاب می‌کند", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({
                    name: ["این فیلد الزامی است."],
                }),
            })
        );

        const { result } = renderHook(() => useApi());

        await expect(
            result.current.request("/api/products/")
        ).rejects.toMatchObject({
            status: 400,
        });
    });

    it("برای پاسخ 204 مقدار null برمی‌گرداند", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                status: 204,
            })
        );

        const { result } = renderHook(() => useApi());

        await expect(
            result.current.request("/api/products/1/", {
                method: "DELETE",
            })
        ).resolves.toBeNull();
    });

    it("خطای شبکه را بدون پنهان‌کردن منتشر می‌کند", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockRejectedValue(
                new Error("Network unavailable")
            )
        );

        const { result } = renderHook(() => useApi());

        await expect(
            result.current.request("/api/products/")
        ).rejects.toThrow("Network unavailable");
    });
});