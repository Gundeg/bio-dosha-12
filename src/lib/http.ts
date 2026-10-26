import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { EncryptionKeyError } from "./crypto/fieldEncryption";
import { EncryptionWriteError } from "./crypto/encryptedFields";

/**
 * Shared error handling for API routes. Every error response has the shape
 * { error: string, code: string, fieldErrors?: Record<string, string[]> } so the
 * client (src/lib/api.ts) can show a readable message.
 */

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(status: number, code: string, message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export const unauthorized = () => new HttpError(401, "unauthorized", "Нэвтэрнэ үү.");
export const forbidden = (message = "Танд энэ үйлдлийг хийх эрх алга.") =>
  new HttpError(403, "forbidden", message);
export const notFound = (message = "Олдсонгүй.") => new HttpError(404, "not_found", message);
export const conflict = (code: string, message: string) => new HttpError(409, code, message);
export const badRequest = (message = "Буруу өгөгдөл.", fieldErrors?: Record<string, string[]>) =>
  new HttpError(400, "invalid", message, fieldErrors);

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof HttpError) {
    return NextResponse.json(
      { error: err.message, code: err.code, fieldErrors: err.fieldErrors },
      { status: err.status }
    );
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Буруу өгөгдөл.", code: "invalid", fieldErrors: err.flatten().fieldErrors },
      { status: 400 }
    );
  }
  if (err instanceof EncryptionKeyError) {
    console.error("[api] encryption key problem:", err.message);
    return NextResponse.json(
      { error: "Серверийн тохиргооны алдаа. Админд мэдэгдэнэ үү.", code: "server_config" },
      { status: 500 }
    );
  }
  if (err instanceof EncryptionWriteError) {
    return NextResponse.json({ error: "Буруу өгөгдөл.", code: "invalid" }, { status: 400 });
  }
  console.error("[api] unexpected error", err);
  return NextResponse.json({ error: "Серверийн алдаа гарлаа.", code: "server_error" }, { status: 500 });
}

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Defence in depth against cross-site request forgery. Session cookies are
 * SameSite=Lax already; browsers also label every request with Sec-Fetch-Site,
 * and a state-changing call from another site is refused. Server-to-server
 * calls (future payment webhooks) send no such header and are unaffected.
 */
export function assertNotCrossSite(req: Request): void {
  if (UNSAFE_METHODS.has(req.method) && req.headers.get("sec-fetch-site") === "cross-site") {
    throw new HttpError(403, "cross_site", "Өөр сайтаас ирсэн хүсэлтийг хүлээн авахгүй.");
  }
}

/** Wraps a route handler so thrown HttpErrors become JSON responses. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      if (args[0] instanceof Request) assertNotCrossSite(args[0]);
      return await fn(...args);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** Parses a JSON body; an unreadable body becomes an empty object for validation. */
export async function readJson(req: Request): Promise<unknown> {
  return req.json().catch(() => ({}));
}
