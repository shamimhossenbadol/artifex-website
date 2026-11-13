// <Field> wires label, hint and error ids into its control through context (ADR-038), including
// when the control arrives as a lazy node, as Server Component output does after client-side
// navigation (that case used to crash with "Cannot read properties of undefined (reading 'id')").
import { createElement, lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { prerenderToNodeStream } from "react-dom/static";
import { describe, expect, it } from "vitest";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

/** Renders to HTML and fails on any render error (Suspense would otherwise hide it). */
async function render(node: ReactNode): Promise<string> {
  const errors: unknown[] = [];
  const { prelude } = await prerenderToNodeStream(createElement(Suspense, null, node), {
    onError: (error) => {
      errors.push(error);
    },
  });
  let html = "";
  for await (const chunk of prelude) html += String(chunk);
  if (errors.length > 0) throw errors[0];
  return html;
}

function attr(html: string, tag: string, name: string): string | undefined {
  const match = new RegExp(`<${tag}\\b[^>]*\\s${name}="([^"]*)"`).exec(html);
  return match?.[1];
}

describe("Field", () => {
  it("links label, control, hint and error", async () => {
    const html = await render(
      createElement(Field, {
        label: "Title",
        hint: "Shown on cards.",
        error: "Title is required",
        children: createElement(Input, { name: "title" }),
      }),
    );
    const id = attr(html, "label", "for");
    expect(id).toBeTruthy();
    expect(attr(html, "input", "id")).toBe(id);
    expect(attr(html, "input", "aria-describedby")).toBe(`${id}-hint ${id}-error`);
    expect(attr(html, "input", "aria-invalid")).toBe("true");
  });

  it("reaches a <select> inside Select's wrapper", async () => {
    const html = await render(
      createElement(Field, { label: "Category", children: createElement(Select, { name: "c" }) }),
    );
    const id = attr(html, "label", "for");
    expect(id).toBeTruthy();
    expect(attr(html, "select", "id")).toBe(id);
  });

  it("works when the control is a lazy node", async () => {
    // A lazy *node* (not a lazy component): it resolves to an element, like an RSC reference.
    const element = createElement(Input, { name: "title" });
    const lazyNode = lazy(async () => ({ default: element as unknown as ComponentType }));
    const html = await render(
      createElement(Field, { label: "Title", children: lazyNode as unknown as ReactNode }),
    );
    const id = attr(html, "label", "for");
    expect(id).toBeTruthy();
    expect(attr(html, "input", "id")).toBe(id);
  });

  it("lets an explicit id win and leaves controls outside a Field alone", async () => {
    const html = await render(createElement(Input, { name: "q", id: "search" }));
    expect(attr(html, "input", "id")).toBe("search");
    expect(attr(html, "input", "aria-describedby")).toBeUndefined();
  });
});
