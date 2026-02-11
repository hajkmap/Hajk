import js from "@eslint/js";
import globals from "globals";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

// Here's the new flat style config for ESLint, as of 2026. I tried to follow
// the default Vite config as much as possible, take a look at
// https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react.

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"], // We want ESlint to only care of these files
    extends: [
      js.configs.recommended, // Core JS rules (no-unused-vars, no-undef, basic stuff)
      reactPlugin.configs.flat.recommended, // React-specific rules. This does not exist in the default create-vite template, but given we're React-heavy, I find it useful.
      reactPlugin.configs.flat["jsx-runtime"], // More recommended React rules.
      reactHooks.configs.flat.recommended, // Rules-of-hooks. Not part of default React plugin config.
      reactRefresh.configs.vite, // This one warns if we try to export something that breaks Vite's HMR.
      jsxA11y.flatConfigs.recommended, // Accessibility rules for JSX elements, we had that previously so let's keep it.
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: {
      react: { version: "detect" },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error", // run Prettier as an ESLint rule
      "arrow-body-style": "off", // let Prettier handle this
      "prefer-arrow-callback": "off", // same, avoid conflicts with Prettier
    },
  },
  prettierConfig, // disables ESLint rules that would conflict with Prettier
]);
