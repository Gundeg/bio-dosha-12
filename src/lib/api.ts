/**
 * Нэгдсэн fetch давхарга. API route бүр {error, fieldErrors} хэлбэрээр
 * алдаа буцаадаг тул алдааг залгиулахгүй, ApiError болгон шиднэ —
 * дуудсан тал ErrorState/toast-оор заавал харуулна.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch {
    throw new ApiError(0, "Сүлжээний алдаа гарлаа. Холболтоо шалгана уу.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      (data as { error?: string } | null)?.error ??
        `Алдаа гарлаа (${res.status}). Дахин оролдоно уу.`,
      (data as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors
    );
  }
  return data as T;
}
