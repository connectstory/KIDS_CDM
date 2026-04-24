import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error - Node.js built-in modules
import { dirname, resolve } from "path";
// @ts-expect-error - Node.js built-in modules
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";

// @ts-expect-error - import.meta.url is available in Vite/Node.js ESM context
const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");

  const base = (env.VITE_APP_BASE || "/").replace(/\/$/, "/");

  return {
    base,
    plugins: [react(), tailwindcss(), svgr()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: ["@ckeditor/ckeditor5-react"],
    },
    build: {
      sourcemap: true,
      commonjsOptions: {
        include: [/ckeditor5/, /node_modules/],
      },
    },
  };
});
