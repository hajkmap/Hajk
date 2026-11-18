import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react-swc";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
  },
  resolve: {
    alias: {
      components: path.resolve(__dirname, "./src/components"),
      utils: path.resolve(__dirname, "./src/utils"),
      hooks: path.resolve(__dirname, "./src/hooks"),
      src: path.resolve(__dirname, "./src"),
      plugins: path.resolve(__dirname, "./src/plugins"),
    },
  },
  build: {
    target: "baseline-widely-available",
    outDir: "build",
    assetsDir: "static",
    sourcemap: false,
    rolldownOptions: {
      output: {
        // Rolldown only accepts the function form of manualChunks
        manualChunks(id) {
          if (id.endsWith("/src/components/App.jsx")) return "app-core";
        },
      },
    },
  },
});
