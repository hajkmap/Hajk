import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/

export default defineConfig({
  base: "/",
  plugins: [react()],
  resolve: {
    alias: {
      "components": path.resolve(__dirname, "./src/components"),
    },
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
});
