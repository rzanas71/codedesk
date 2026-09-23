// @vitest-environment node
//
// dart-sass's node entry is the supported path in vitest; the browser build
// (sass.default.js) is exercised by the smoke/preview runs instead.
import { describe, expect, it } from "vitest";
import { compileSCSS } from "./sassRunner";

describe("compileSCSS", () => {
  it("flattens nesting and resolves variables", async () => {
    const css = await compileSCSS(
      `$accent: #0b5fff;\nbody {\n  font-family: system-ui;\n  h1 { color: $accent; }\n}`,
    );
    expect(css).toContain("body h1");
    expect(css).toContain("color: #0b5fff");
    expect(css).not.toContain("$accent");
  });

  it("rejects invalid scss with a readable error", async () => {
    await expect(compileSCSS("body {")).rejects.toThrow(/\S/);
  });

  it("rejects empty or whitespace-only source", async () => {
    await expect(compileSCSS("")).rejects.toThrow(/empty/i);
    await expect(compileSCSS("   \n\t ")).rejects.toThrow(/empty/i);
  });
});
