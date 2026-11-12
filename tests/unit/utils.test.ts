import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("keeps a custom type-scale class together with a text colour", () => {
    expect(cn("text-h1", "text-ink")).toBe("text-h1 text-ink");
  });

  it("lets a later type-scale class win over an earlier one", () => {
    expect(cn("text-body", "text-small")).toBe("text-small");
  });

  it("resolves conflicting colours and drops falsy values", () => {
    expect(cn("text-ink", false && "hidden", "text-muted")).toBe("text-muted");
  });
});
