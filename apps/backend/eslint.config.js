// @ts-check
import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    ignores: [
      "node_modules/",
      "dist/",
      "public/api-explorer/",
      "*.yaml",
      "*.yml",
    ],
  }
);
