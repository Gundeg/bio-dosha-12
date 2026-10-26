import { describe, expect, it } from "vitest";
import { firstParam, loginHref, parseLoginNotice, safeNext } from "../safeNext";

describe("safeNext", () => {
  it("keeps same-site paths, with query and hash", () => {
    expect(safeNext("/")).toBe("/");
    expect(safeNext("/patients/123")).toBe("/patients/123");
    expect(safeNext("/settings?tab=security")).toBe("/settings?tab=security");
    expect(safeNext("/invite/abcDEF_123-xyz")).toBe("/invite/abcDEF_123-xyz");
    expect(safeNext("/history#latest")).toBe("/history#latest");
  });

  it("rejects anything that could leave the site (open redirect)", () => {
    for (const value of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "\\\\evil.example",
      "/\t/evil.example", // browsers drop the tab: "//evil.example"
      "/\n/evil.example",
      "javascript:alert(1)",
      " /dashboard",
      "dashboard",
      "",
    ]) {
      expect(safeNext(value), value).toBeNull();
    }
  });

  it("rejects missing, oversized and API destinations", () => {
    expect(safeNext(null)).toBeNull();
    expect(safeNext(undefined)).toBeNull();
    expect(safeNext(`/${"a".repeat(3000)}`)).toBeNull();
    expect(safeNext("/api/auth/signout")).toBeNull();
    expect(safeNext("/api")).toBeNull();
    expect(safeNext("/apis")).toBe("/apis");
  });

  it("returns the normalized path that was checked", () => {
    expect(safeNext("/a/../dashboard")).toBe("/dashboard");
  });
});

describe("query helpers", () => {
  it("takes the first value of a repeated parameter", () => {
    expect(firstParam(["/a", "/b"])).toBe("/a");
    expect(firstParam("/a")).toBe("/a");
    expect(firstParam(undefined)).toBeUndefined();
  });

  it("accepts only the notices the sign-in page knows", () => {
    expect(parseLoginNotice("password_reset")).toBe("password_reset");
    expect(parseLoginNotice("password_changed")).toBe("password_changed");
    expect(parseLoginNotice("signed_out")).toBe("signed_out");
    expect(parseLoginNotice("account_created")).toBe("account_created");
    expect(parseLoginNotice("<script>")).toBeNull();
    expect(parseLoginNotice(undefined)).toBeNull();
  });

  it("encodes the destination for the sign-in link", () => {
    expect(loginHref("/invite/abc")).toBe("/login?next=%2Finvite%2Fabc");
    expect(safeNext(decodeURIComponent(loginHref("/mfa-setup?next=%2Fsettings").split("next=")[1]))).toBe(
      "/mfa-setup?next=%2Fsettings"
    );
  });
});
