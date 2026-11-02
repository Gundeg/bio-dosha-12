import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Dot } from "../status";

describe("Dot", () => {
  it("renders a decorative 8px round marker in the given fill", () => {
    const html = renderToStaticMarkup(createElement(Dot, { fill: "bg-primary" }));
    expect(html).toBe('<span aria-hidden="true" class="size-2 shrink-0 rounded-full bg-primary"></span>');
  });

  it("appends extra classes for alignment", () => {
    const html = renderToStaticMarkup(createElement(Dot, { fill: "bg-tertiary", className: "mt-1.5" }));
    expect(html).toContain('class="size-2 shrink-0 rounded-full bg-tertiary mt-1.5"');
  });
});
