// @vitest-environment node
//
// esbuild's node entry checks `TextEncoder().encode("") instanceof Uint8Array`,
// which fails under jsdom's cross-realm TextEncoder. This suite needs no DOM.
import { beforeAll, describe, expect, it } from "vitest";
import { compileJSX, initEsbuild } from "./esbuildRunner";

beforeAll(async () => {
  await initEsbuild();
}, 60000);

describe("compileJSX", () => {
  it("uses the classic transform — emits React.createElement, never the automatic runtime", async () => {
    const out = await compileJSX(
      `const el = <div className="x">hi</div>;`,
    );
    expect(out).toContain("React.createElement");
    expect(out).not.toContain("jsx-runtime");
    expect(out).not.toMatch(/\bjsx\s*\(/);
  });

  it("passes through plain JavaScript unchanged", async () => {
    const out = await compileJSX(`const a = 1 + 2;`);
    expect(out).toContain("const a");
    expect(out).not.toContain("React.createElement");
  });

  it("rejects invalid syntax with a readable error", async () => {
    await expect(compileJSX(`const broken = ;`)).rejects.toThrow(/\S/);
  });

  it("rejects empty or whitespace-only source", async () => {
    await expect(compileJSX("")).rejects.toThrow(/empty/i);
    await expect(compileJSX("   \n\t ")).rejects.toThrow(/empty/i);
  });
});
