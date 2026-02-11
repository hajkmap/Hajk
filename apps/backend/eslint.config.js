import js from "@eslint/js";
import globals from "globals";
import nodePlugin from "eslint-plugin-n";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

// Flat config for ESLint 9, following the same pattern as the client config.
// See also: https://github.com/eslint-community/eslint-plugin-n

export default defineConfig([
  globalIgnores(["dist", "public/api-explorer"]),
  {
    files: ["server/**/*.js"],
    extends: [
      js.configs.recommended,
      nodePlugin.configs["flat/recommended"], // Catches things like correct imports, only allow supported syntax (by looking at `engine` in package.json)
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.node, // Tells ESlint that stuff like __dirname are valid globals.
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error", // run Prettier as an ESLint rule
    },
  },
  prettierConfig, // disables ESLint rules that would conflict with Prettier
]);
