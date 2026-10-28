import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signOut = vi.fn();
vi.mock("next-auth/react", () => ({ signIn: vi.fn(), signOut: (...args: unknown[]) => signOut(...args) }));

const { signOutHere } = await import("../session");

const assign = vi.fn();

/** What GET /api/auth/session answers after the sign-out request. */
function sessionAfterSignOut(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(body), { status }))
  );
}

beforeEach(() => {
  signOut.mockReset().mockResolvedValue(undefined);
  assign.mockReset();
  vi.stubGlobal("window", { location: { assign } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("signOutHere", () => {
  it("opens the sign-in page once the session is really gone", async () => {
    sessionAfterSignOut(null);
    await expect(signOutHere()).resolves.toBe(true);
    expect(signOut).toHaveBeenCalledWith({ redirect: false });
    expect(assign).toHaveBeenCalledWith("/login?notice=signed_out_here");
  });

  it("reports failure when the session survives a 200 sign-out (cookie re-issued)", async () => {
    sessionAfterSignOut({ user: { email: "doctor@example.com" }, expires: "2099-01-01T00:00:00.000Z" });
    await expect(signOutHere()).resolves.toBe(false);
    expect(signOut).toHaveBeenCalledTimes(2);
    expect(assign).not.toHaveBeenCalled();
  });

  it("does not treat an unreadable session check as signed out", async () => {
    sessionAfterSignOut({ message: "error" }, 500);
    await expect(signOutHere()).resolves.toBe(false);
    expect(assign).not.toHaveBeenCalled();
  });

  it("retries once when the sign-out request itself fails", async () => {
    signOut.mockRejectedValueOnce(new Error("offline"));
    sessionAfterSignOut(null);
    await expect(signOutHere()).resolves.toBe(true);
    expect(signOut).toHaveBeenCalledTimes(2);
  });
});
