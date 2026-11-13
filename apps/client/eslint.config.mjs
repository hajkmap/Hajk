import js from "@eslint/js";
import globals from "globals";
import eslintReact from "@eslint-react/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11yX from "eslint-plugin-jsx-a11y-x";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

// Flat config for ESLint 10. I tried to follow
// the default Vite config as much as possible, take a look at
// https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react.

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"], // We want ESlint to only care of these files
    extends: [
      js.configs.recommended, // Core JS rules (no-unused-vars, no-undef, basic stuff)
      ...tseslint.configs.recommended, // TypeScript-specific rules
      eslintReact.configs.recommended, // React-specific rules (@eslint-react replaces eslint-plugin-react, which doesn't support ESLint 10). Not "recommended-typescript", as most of our code is still JS.
      reactHooks.configs.flat.recommended, // Rules-of-hooks. Not part of default React plugin config.
      reactRefresh.configs.vite, // This one warns if we try to export something that breaks Vite's HMR.
      jsxA11yX.configs.recommended, // Accessibility rules for JSX elements. A fork of eslint-plugin-jsx-a11y, which doesn't support ESLint 10.
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
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "prettier/prettier": "error", // run Prettier as an ESLint rule
      "arrow-body-style": "off", // let Prettier handle this
      "prefer-arrow-callback": "off", // same, avoid conflicts with Prettier
      // @eslint-react ships its own ports of the React Compiler rules. We keep the
      // official eslint-plugin-react-hooks for those, so disable the duplicates.
      "@eslint-react/error-boundaries": "off",
      "@eslint-react/exhaustive-deps": "off",
      "@eslint-react/purity": "off",
      "@eslint-react/rules-of-hooks": "off",
      "@eslint-react/set-state-in-effect": "off",
      "@eslint-react/set-state-in-render": "off",
      "@eslint-react/static-components": "off",
      "@eslint-react/unsupported-syntax": "off",
      "@eslint-react/use-memo": "off",
    },
  },
  prettierConfig, // disables ESLint rules that would conflict with Prettier
]);
