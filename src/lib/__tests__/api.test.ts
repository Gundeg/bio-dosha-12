import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, ApiError } from "../api";

function mockResponse(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(body), { status }))
  );
}

async function errorOf(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (err) {
    return err as ApiError;
  }
  throw new Error("expected apiFetch to throw");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch error messages", () => {
  it("uses a string error as-is", async () => {
    mockResponse(404, { error: "Профайл олдсонгүй" });
    const err = await errorOf(apiFetch("/api/x"));
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
    expect(err.message).toBe("Профайл олдсонгүй");
  });

  it("turns a zod flatten() object into readable text instead of [object Object]", async () => {
    mockResponse(422, {
      error: { formErrors: [], fieldErrors: { weightKg: ["Too big"], heightCm: ["Too small"] } },
    });
    const err = await errorOf(apiFetch("/api/bedi", { method: "POST", body: "{}" }));
    expect(err.message).not.toContain("[object Object]");
    expect(err.message).toContain("Жин");
    expect(err.message).toContain("Өндөр");
    expect(err.fieldErrors).toEqual({ weightKg: ["Too big"], heightCm: ["Too small"] });
  });

  it("falls back to a generic message with the status code", async () => {
    mockResponse(500, null);
    const err = await errorOf(apiFetch("/api/x"));
    expect(err.message).toContain("500");
  });
});
