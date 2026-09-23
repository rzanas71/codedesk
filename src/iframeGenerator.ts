import type { Preset } from "./presets";
import { TOKENS } from "./styles/tokens";

/**
 * Injected as the first script in the sandbox <head>.
 * - Wraps console.log/info/warn/error and forwards entries to the parent.
 * - Captures uncaught errors and unhandled rejections.
 * - Pings the parent with ALIVE once parsing completes (DOMContentLoaded).
 *   User code in <body> blocks parsing, so an infinite loop never sends ALIVE
 *   and the parent-side watchdog trips.
 */
export const CONSOLE_SHIM = `
(function () {
  var formatArg = function (a) {
    try {
      if (typeof a === "object" && a !== null) return JSON.stringify(a, null, 2);
      return String(a);
    } catch (e) {
      return String(a);
    }
  };

  ["log", "info", "warn", "error"].forEach(function (method) {
    var orig = console[method];
    console[method] = function () {
      var args = Array.prototype.slice.call(arguments);
      orig.apply(console, args);
      parent.postMessage(
        { source: "codedesk", type: "console", method: method, args: args.map(formatArg) },
        "*"
      );
    };
  });

  window.addEventListener("error", function (event) {
    parent.postMessage(
      {
        source: "codedesk",
        type: "console",
        method: "error",
        args: [event.message + (event.lineno ? " (line " + event.lineno + ")" : "")],
      },
      "*"
    );
  });

  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    var text = reason && reason.message ? reason.message : reason;
    parent.postMessage(
      { source: "codedesk", type: "console", method: "error", args: ["Unhandled rejection: " + formatArg(text)] },
      "*"
    );
  });

  var ping = function () {
    parent.postMessage({ source: "codedesk", type: "ALIVE" }, "*");
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ping);
  } else {
    ping();
  }
})();
`;

const DEFAULT_SHELL = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
</head>
<body></body>
</html>
`;

function escapeForScript(code: string): string {
  return code.replace(/<\/script/gi, "<\\/script");
}

/**
 * Subresource Integrity for every pinned CDN URL (sha384 computed from the
 * exact bytes at pin time). Pyodide is loaded via dynamic `import()` in a
 * worker — SRI cannot attach to module imports; that gap is accepted + noted.
 */
const SRI: Record<string, string> = {
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css":
    "sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js":
    "sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz",
  "https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js":
    "sha384-1H217gwSVyLSIfaLxHbE7dRb3v4mYCKbpQvzx0cegeju1MVsGrX5xXxAvs/HgeFs",
  "https://unpkg.com/react@18.3.1/umd/react.production.min.js":
    "sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z",
  "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js":
    "sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1",
};

function cdnAttrs(url: string): string {
  const hash = SRI[url];
  return hash ? ` integrity="${hash}" crossorigin="anonymous"` : "";
}

function cdnTagsFor(cdn: string[]): string {
  return cdn
    .map((url) =>
      url.endsWith(".css")
        ? `<link rel="stylesheet" href="${url}"${cdnAttrs(url)} />`
        : `<script src="${url}"${cdnAttrs(url)}></script>`,
    )
    .join("\n    ");
}

/** Preview pane is white — paint it before user CSS lands. */
const PAPER_CANVAS = `<style>html{background:${TOKENS.outputPaper};}</style>`;

export function generateSrcdoc(
  preset: Preset,
  files: Record<string, string>,
): string {
  // Head order: console shim first, then paper canvas, then preset CDNs — so
  // CDN scripts (Bootstrap, jQuery, React UMD) always execute before the
  // user's inline script in <body>.
  const headBits = [`<script>${CONSOLE_SHIM}</script>`, PAPER_CANVAS];
  const cdnTags = cdnTagsFor(preset.cdn);
  if (cdnTags) headBits.push(cdnTags);

  const css = files["styles.css"] ?? "";
  const js = files["script.js"] ?? "";

  const bodyBits: string[] = [];
  if (css) bodyBits.push(`<style>\n${css}\n</style>`);
  if (js) bodyBits.push(`<script>\n${escapeForScript(js)}\n</script>`);

  let html = files["index.html"] ?? DEFAULT_SHELL;
  const headInjection = headBits.join("\n    ");
  const bodyInjection = bodyBits.join("\n    ");

  // Replace via callbacks so `$` sequences in user code are not treated as
  // replacement patterns.
  if (/<\/head>/i.test(html)) {
    html = html.replace(/<\/head>/i, () => `    ${headInjection}\n  </head>`);
  } else {
    html = `${headInjection}${html}`;
  }

  if (/<\/body>/i.test(html)) {
    html = html.replace(/<\/body>/i, () => `    ${bodyInjection}\n  </body>`);
  } else {
    html = `${html}${bodyInjection}`;
  }

  return html;
}
