# Hajk Admin

- Run commands from `apps/admin`; this app manages its own dependencies.
- The current stack is React 19, TypeScript 6, Vite 8, and MUI 9. This overrides the outdated legacy-admin details in the root guide.
- Use functional components and hooks, follow existing patterns, and keep changes focused.
- Runtime API configuration lives in `public/config.json`.
- Translate user-facing text with `react-i18next` (`useTranslation` / `t`); reuse existing keys and keep `src/i18n/translations/sv.json` and `en.json` in sync.
- Use `npm run dev` to start development and `npm run build` to type-check and build.
- Run `npm run lint` and relevant tests with `npm test` for code changes.
