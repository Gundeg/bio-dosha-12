import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH } from "@/lib/credentials";

export { PASSWORD_MIN_LENGTH };

export type PasswordProblem = "required" | "tooShort" | "tooLong";

/**
 * The server's password rule (src/lib/credentials.ts): at least
 * PASSWORD_MIN_LENGTH characters and at most PASSWORD_MAX_BYTES bytes, because
 * bcrypt ignores everything after 72 bytes (a Cyrillic letter takes 2 bytes).
 */
export function passwordProblem(password: string): PasswordProblem | null {
  if (password.length === 0) return "required";
  if (password.length < PASSWORD_MIN_LENGTH) return "tooShort";
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) return "tooLong";
  return null;
}

export type PasswordStrength = "weak" | "fair" | "good" | "strong";

// Passwords people pick first; they are rated weak whatever their length.
const COMMON = new Set([
  "password",
  "password1",
  "password123",
  "qwerty",
  "qwertyui",
  "qwerty123",
  "12345678",
  "123456789",
  "1234567890",
  "87654321",
  "11111111",
  "00000000",
  "iloveyou",
  "admin123",
  "abc12345",
  "abcd1234",
  "biodosha",
  "biodosha12",
]);

// Explicit ranges instead of \p{…} so the code works with the ES2017 target.
// Mongolian Cyrillic adds Ө/ө and Ү/ү to the Russian alphabet.
const CHARACTER_CLASSES = [/[a-zа-яёөү]/, /[A-ZА-ЯЁӨҮ]/, /[0-9]/, /[^a-zA-Zа-яА-ЯёЁөӨүҮ0-9]/];

/**
 * A simple, explainable strength hint: longer is better, mixing letters,
 * capitals, digits and symbols helps. It only guides; the server enforces the
 * minimum rule above.
 */
export function passwordStrength(password: string): PasswordStrength | null {
  if (!password) return null;
  if (password.length < PASSWORD_MIN_LENGTH) return "weak";
  if (COMMON.has(password.toLowerCase().replace(/[\s_.-]/g, "")) || /^(.)\1+$/.test(password)) return "weak";

  let score = 1;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  const classes = CHARACTER_CLASSES.filter((re) => re.test(password)).length;
  if (classes >= 2) score++;
  if (classes >= 3) score++;
  if (score <= 1) return "weak";
  if (score === 2) return "fair";
  if (score === 3) return "good";
  return "strong";
}

/** Message key (under `authFlows`) for a password problem. */
export function passwordProblemKey(problem: PasswordProblem): string {
  return `password.${problem}`;
}
