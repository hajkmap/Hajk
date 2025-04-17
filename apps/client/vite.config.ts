import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/

export default defineConfig({
  base: "/",
  plugins: [react()],
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
    target: "ES2022",
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
});
