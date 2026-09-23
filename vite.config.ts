import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // Discover heavy runners at server start — learning about them mid-session
    // (first SCSS/JSX run) triggers a full page reload and wipes user state.
    include: ["sass", "esbuild-wasm"],
  },
  build: {
    // Monaco (language services + workers) now lives in a lazy chunk and
    // still dominates the graph — raise the warning bar so the log stays
    // signal (a regression = something new crossing ~4MB raw, not monaco).
    chunkSizeWarningLimit: 4000,
  },
  // Verified: bundled dart-sass compiles correctly under Rolldown's minifier
  // (production smoke asserts a rendered $accent color end-to-end).
});
