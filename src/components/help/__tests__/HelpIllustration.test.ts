import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { HelpIllustration } from "../illustrations";

const mn = JSON.parse(readFileSync(join(process.cwd(), "messages", "mn", "questionHelp.json"), "utf-8"));

// Typed loosely so children can be passed as createElement's third argument (react/no-children-prop).
const Provider = NextIntlClientProvider as unknown as ComponentType<{
  locale: string;
  timeZone: string;
  messages: Record<string, unknown>;
}>;

function render(props: Parameters<typeof HelpIllustration>[0]): string {
  return renderToStaticMarkup(
    createElement(
      Provider,
      { locale: "mn", timeZone: "Asia/Ulaanbaatar", messages: { questionHelp: mn } },
      createElement(HelpIllustration, props)
    )
  );
}

const frames = (html: string) => html.match(/class="help-frame\b/g)?.length ?? 0;
const images = (html: string) => html.match(/<img\b/g)?.length ?? 0;

describe("HelpIllustration", () => {
  it("cycles through three image frames with the outcome label on each", () => {
    const html = render({ questionId: 1 });
    expect(html).toContain('data-variant="cycle"');
    expect(frames(html)).toBe(3);
    expect(images(html)).toBe(3);
    for (const d of ["H", "S", "B"] as const) {
      expect(html).toContain(mn.q1.outcomes[d].label);
    }
    expect(html).toContain(`aria-label="${mn.q1.ariaLabel}"`);
  });

  it("renders one frame and no label chip when frozen on an outcome", () => {
    const html = render({ questionId: 1, variant: "S" });
    expect(html).toContain('data-variant="S"');
    expect(frames(html)).toBe(1);
    expect(images(html)).toBe(1);
    expect(html).not.toContain(mn.q1.outcomes.S.label);
  });

  it("never shows the махбод letters to the person answering", () => {
    const text = render({ questionId: 1 }).replace(/<[^>]+>/g, " ");
    expect(text).not.toMatch(/(^|\s)[ХШБ](\s|$|:)/);
  });

  it("renders nothing for a question without frames", () => {
    expect(render({ questionId: 99 })).toBe("");
  });
});
