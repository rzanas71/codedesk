export type PresetKey =
  | "html"
  | "bootstrap"
  | "jquery"
  | "scss"
  | "react"
  | "python";

export type PresetRuntime = "pyodide" | "esbuild" | "sass";

export interface Preset {
  label: string;
  cdn: string[];
  defaultFiles: Record<string, string>;
  language: string;
  runtime?: PresetRuntime;
}

export const presets: Record<PresetKey, Preset> = {
  html: {
    label: "HTML",
    cdn: [],
    defaultFiles: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HTML Sandbox</title>
</head>
<body>
  <h1>Hello, HTML</h1>
  <p>Edit the HTML, CSS, or JS and press Run.</p>
</body>
</html>
`,
      "styles.css": `body {
  font-family: system-ui, sans-serif;
  margin: 2rem;
  color: #222;
}

h1 {
  color: #0b5fff;
}
`,
      "script.js": `console.log("Hello from CodeDesk");
console.info("Edit script.js and press Run");
`,
    },
    language: "html",
  },

  bootstrap: {
    label: "Bootstrap",
    cdn: [
      "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
      "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
    ],
    defaultFiles: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bootstrap Sandbox</title>
</head>
<body>
  <div class="container py-4">
    <h1 class="mb-3">Hello, Bootstrap</h1>
    <button class="btn btn-primary" id="cta">Click me</button>
    <p class="mt-3 text-muted" id="status">Not clicked yet.</p>
  </div>
</body>
</html>
`,
      "styles.css": `/* Bootstrap provides the base styles — override freely here. */
.container {
  max-width: 640px;
}
`,
      "script.js": `document.getElementById("cta").addEventListener("click", () => {
  document.getElementById("status").textContent =
    "Clicked at " + new Date().toLocaleTimeString();
  console.log("Bootstrap button clicked");
});
`,
    },
    language: "html",
  },

  jquery: {
    label: "jQuery",
    cdn: ["https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"],
    defaultFiles: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>jQuery Sandbox</title>
</head>
<body>
  <h1 id="title">Hello, jQuery</h1>
  <button id="toggle">Toggle message</button>
  <p id="msg" style="display: none">Toggled with jQuery.</p>
</body>
</html>
`,
      "script.js": `$("#toggle").on("click", function () {
  $("#msg").toggle();
  console.log("jQuery toggle clicked");
});
`,
    },
    language: "js",
  },

  scss: {
    label: "SCSS",
    cdn: [],
    defaultFiles: {
      "styles.scss": `$accent: #0b5fff;

body {
  font-family: system-ui, sans-serif;
  margin: 2rem;

  h1 {
    color: $accent;
  }

  button {
    padding: 0.5rem 1rem;
    border: 1px solid $accent;
    background: transparent;
    color: $accent;
    cursor: pointer;

    &:hover {
      background: $accent;
      color: white;
    }
  }
}
`,
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SCSS Sandbox</title>
</head>
<body>
  <h1>Hello, SCSS</h1>
  <button>Hover me</button>
</body>
</html>
`,
    },
    language: "scss",
    runtime: "sass",
  },

  react: {
    label: "React",
    cdn: [
      // Exact-version pins (mutable tags can move under you) + sha384 SRI in
      // iframeGenerator's CDN attrs.
      "https://unpkg.com/react@18.3.1/umd/react.production.min.js",
      "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js",
    ],
    defaultFiles: {
      "App.jsx": `function Counter() {
  const [n, setN] = React.useState(0);
  return (
    <main style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>Practice JSX</h1>
      <button onClick={() => setN(n + 1)}>Count: {n}</button>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Counter />);
`,
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>React Sandbox</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
`,
    },
    language: "jsx",
    runtime: "esbuild",
  },

  python: {
    label: "Python",
    cdn: [],
    defaultFiles: {
      "main.py": `print("Hello from Python")

total = sum(range(10))
print("sum(range(10)) =", total)
`,
    },
    language: "python",
    runtime: "pyodide",
  },
};

export const presetOrder: PresetKey[] = [
  "html",
  "bootstrap",
  "jquery",
  "scss",
  "react",
  "python",
];
