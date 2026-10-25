import { defineConfig } from "tsup";

const DEFAULT_BACKEND_URL =
  process.env.LEOPARDCODE_BACKEND_URL || "https://leopardcode.onrender.com";

export default defineConfig({
  entry: ["src/app.tsx"],
  format: ["esm"],
  outDir: "dist",
  banner: {
    js: "#!/usr/bin/env node",
  },
  clean: true,
  external: ["react", "react/jsx-runtime", "react/jsx-dev-runtime", "ink"],
  define: {
    LEOPARDCODE_DEFAULT_BACKEND_URL: JSON.stringify(DEFAULT_BACKEND_URL),
  },
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
