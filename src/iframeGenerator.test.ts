import { describe, expect, it } from "vitest";
import { CONSOLE_SHIM, generateSrcdoc } from "./iframeGenerator";
import { presets } from "./presets";

describe("CONSOLE_SHIM", () => {
  it("forwards console entries to the parent", () => {
    expect(CONSOLE_SHIM).toContain('type: "console"');
    expect(CONSOLE_SHIM).toContain('"codedesk"');
    expect(CONSOLE_SHIM).toContain('"log"');
    expect(CONSOLE_SHIM).toContain('"error"');
  });

  it("sends the ALIVE handshake after user code finishes parsing", () => {
    expect(CONSOLE_SHIM).toContain('type: "ALIVE"');
    expect(CONSOLE_SHIM).toContain("DOMContentLoaded");
  });

  it("captures uncaught errors", () => {
    expect(CONSOLE_SHIM).toContain('addEventListener("error"');
    expect(CONSOLE_SHIM).toContain('addEventListener("unhandledrejection"');
  });
});

describe("generateSrcdoc", () => {
  it("injects the shim before CDNs, and CDNs before user script", () => {
    const files = {
      ...presets.bootstrap.defaultFiles,
      "script.js": "window.__userRan = true;",
    };
    const html = generateSrcdoc(presets.bootstrap, files);

    const shimAt = html.indexOf("formatArg");
    const paperAt = html.indexOf("html{background:#ffffff;");
    const cdnAt = html.indexOf("bootstrap@5.3.3/dist/css");
    const cdnJsAt = html.indexOf("bootstrap@5.3.3/dist/js");
    const userAt = html.indexOf("__userRan");

    expect(shimAt).toBeGreaterThan(-1);
    expect(paperAt).toBeGreaterThan(shimAt);
    expect(cdnAt).toBeGreaterThan(paperAt);
    expect(cdnJsAt).toBeGreaterThan(shimAt);
    expect(userAt).toBeGreaterThan(cdnJsAt);
  });

  it("injects a <link> tag with SRI for CSS CDNs", () => {
    const html = generateSrcdoc(presets.bootstrap, presets.bootstrap.defaultFiles);
    expect(html).toContain(
      '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" integrity="sha384-',
    );
    expect(html).toContain('crossorigin="anonymous"');
  });

  it("emits SRI attributes on pinned React UMD scripts", () => {
    const html = generateSrcdoc(presets.react, presets.react.defaultFiles);
    expect(html).toContain(
      'https://unpkg.com/react@18.3.1/umd/react.production.min.js" integrity="sha384-',
    );
    expect(html).toContain(
      'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" integrity="sha384-',
    );
    expect(html).not.toContain("react@18/umd");
  });

  it("inlines styles.css as a style block", () => {
    const html = generateSrcdoc(presets.html, presets.html.defaultFiles);
    expect(html).toContain("<style>");
    expect(html).toContain("color: #0b5fff");
  });

  it("uses index.html as the document shell", () => {
    const html = generateSrcdoc(presets.html, presets.html.defaultFiles);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<h1>Hello, HTML</h1>");
    expect(html).toContain("</html>");
  });

  it("escapes </script sequences in user JS", () => {
    const files = {
      ...presets.html.defaultFiles,
      "script.js": 'var s = "</script>";',
    };
    const html = generateSrcdoc(presets.html, files);
    expect(html).toContain('var s = "<\\/script>"');
    expect(html).not.toContain('var s = "</script>"');
  });

  it("falls back to a default shell when index.html is missing", () => {
    const html = generateSrcdoc(presets.react, {});
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("formatArg"); // shim still present
  });

  it("keeps user CSS containing $ sequences intact (replace-pattern safety)", () => {
    const files = {
      ...presets.html.defaultFiles,
      "styles.css": 'a { content: "$& $`"; }',
      "script.js": 'console.log("$&");',
    };
    const html = generateSrcdoc(presets.html, files);
    expect(html).toContain('content: "$& $`"');
    expect(html).toContain('console.log("$&")');
  });
});
