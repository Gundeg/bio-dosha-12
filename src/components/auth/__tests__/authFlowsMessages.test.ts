import { describe, expect, it } from "vitest";
import { createTranslator } from "next-intl";
import en from "../../../../messages/en/authFlows.json";
import mn from "../../../../messages/mn/authFlows.json";

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[path] = value;
    else Object.assign(out, flatten(value, path));
  }
  return out;
}

const flat = { en: flatten(en as Tree), mn: flatten(mn as Tree) };

/** {arguments} and <tags> a message uses, so both languages can be compared. */
function placeholders(message: string): string {
  const args = [...message.matchAll(/\{(\w+)\}/g)].map((m) => `{${m[1]}}`);
  const tags = [...message.matchAll(/<(\w+)>/g)].map((m) => `<${m[1]}>`);
  return [...new Set([...args, ...tags])].sort().join(" ");
}

// Every argument and tag the auth pages pass to these messages.
const tag = (chunks: string) => `[${chunks}]`;
const VALUES = {
  min: 8,
  email: "bold@example.mn",
  current: "other@example.mn",
  organization: "Энх-Ундрал эмнэлэг",
  total: 4,
  time: "2026.10.27 14:05",
  date: "2026 оны 10-р сарын 27",
  b: tag,
  link: tag,
  login: tag,
  forgot: tag,
};

describe("authFlows messages", () => {
  it("have the same keys in Mongolian and English", () => {
    expect(Object.keys(flat.mn).sort()).toEqual(Object.keys(flat.en).sort());
  });

  it("use the same arguments and tags in both languages", () => {
    for (const key of Object.keys(flat.en)) {
      expect(placeholders(flat.mn[key] ?? ""), key).toBe(placeholders(flat.en[key]));
    }
  });

  it.each(["mn", "en"] as const)("all format without errors (%s)", (locale) => {
    const t = createTranslator({
      locale,
      messages: { authFlows: locale === "mn" ? mn : en },
      namespace: "authFlows",
      onError: (error) => {
        throw error;
      },
    });
    for (const key of Object.keys(flat[locale])) {
      const text = t.markup(key as never, VALUES as never);
      expect(text.trim().length, key).toBeGreaterThan(0);
      expect(text, key).not.toMatch(/[{}]/);
    }
  });
});
