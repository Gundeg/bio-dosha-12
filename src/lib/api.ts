/**
 * Нэгдсэн fetch давхарга. API route бүр {error, fieldErrors} хэлбэрээр
 * алдаа буцаадаг тул алдааг залгиулахгүй, ApiError болгон шиднэ —
 * дуудсан тал ErrorState/toast-оор заавал харуулна.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;
  /** Machine-readable reason from the API, e.g. "plan_limit" or "mfa_setup_required". */
  readonly code?: string;

  constructor(
    status: number,
    message: string,
    fieldErrors?: Record<string, string[]>,
    code?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.code = code;
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
    const { message, fieldErrors } = describeError(data, res.status);
    const code = typeof (data as { code?: unknown } | null)?.code === "string" ? (data as { code: string }).code : undefined;
    throw new ApiError(res.status, message, fieldErrors, code);
  }
  return data as T;
}

/** Field names used by the API schemas, shown to the user in validation errors. */
const FIELD_LABELS: Record<string, string> = {
  name: "Нэр",
  lastName: "Овог",
  email: "Имэйл",
  password: "Нууц үг",
  birthDate: "Төрсөн огноо",
  sex: "Хүйс",
  heightCm: "Өндөр",
  weightKg: "Жин",
  season: "Улирал",
  ktScore: "Kt коэффициент",
  doshaType: "Махбодын төрөл",
  profileId: "Профайл",
  notes: "Тэмдэглэл",
};

type FlattenedZodError = { formErrors?: string[]; fieldErrors?: Record<string, string[]> };

/**
 * API routes answer errors in two shapes: `{ error: "text", fieldErrors }` or
 * `{ error: zodError.flatten() }`. Passing the second shape straight to
 * `new Error()` produced the message "[object Object]".
 */
function describeError(
  data: unknown,
  status: number
): { message: string; fieldErrors?: Record<string, string[]> } {
  const body = (data ?? {}) as { error?: unknown; fieldErrors?: Record<string, string[]> };
  const fallback = `Алдаа гарлаа (${status}). Дахин оролдоно уу.`;

  if (typeof body.error === "string") {
    return { message: body.error, fieldErrors: body.fieldErrors };
  }

  if (body.error && typeof body.error === "object") {
    const flat = body.error as FlattenedZodError;
    const fieldErrors = flat.fieldErrors ?? body.fieldErrors;
    const fields = Object.keys(fieldErrors ?? {}).map((k) => FIELD_LABELS[k] ?? k);
    if (fields.length > 0) {
      return { message: `Оруулсан утга буруу байна: ${fields.join(", ")}.`, fieldErrors };
    }
    if (flat.formErrors?.length) {
      return { message: `Оруулсан мэдээлэл буруу байна: ${flat.formErrors.join(", ")}`, fieldErrors };
    }
  }

  return { message: fallback, fieldErrors: body.fieldErrors };
}
