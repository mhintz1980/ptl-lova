import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "index.css"),
  "utf8"
);

describe("theme surface styling", () => {
  it("drives body gradient via theme variables", () => {
    expect(css).toMatch(/:root[\s\S]*--body-gradient:/);
    expect(css).toMatch(/body\s*{[\s\S]*background-image:\s*var\(--body-gradient\)/);
    expect(css).toMatch(/\.light[\s\S]*--body-gradient:/);
  });

  it("updates ambient wrapper in light mode", () => {
    expect(css).toMatch(/:root[\s\S]*--ambient-gradient:/);
    expect(css).toMatch(/\.app-ambient\s*{[\s\S]*background-image:\s*var\(--ambient-gradient\)/);
    expect(css).toMatch(/\.light[\s\S]*--ambient-gradient:/);
  });
});
