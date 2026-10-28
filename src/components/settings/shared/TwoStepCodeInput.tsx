"use client";

import { cn } from "@/lib/utils";
import { TextInput } from "./Field";

/**
 * Input for a 6-digit authenticator code or a recovery code (letters and
 * dashes), so it is a text field with one-time-code autofill, not a number field.
 */
export function TwoStepCodeInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <TextInput
      type="text"
      inputMode="text"
      autoComplete="one-time-code"
      autoCapitalize="characters"
      autoCorrect="off"
      spellCheck={false}
      maxLength={20}
      className={cn("font-mono tracking-wider", className)}
      {...props}
    />
  );
}
