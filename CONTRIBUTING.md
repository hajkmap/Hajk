# Contributing

## Required tools

- Node.js ≥22 (LTS)
- Latest Git

## Project structure

Hajk is a monorepo with three independent apps under `apps/` — no root-level workspace tooling. Each app manages its own dependencies.

| App       | Directory       | Port | Stack                                                       |
| --------- | --------------- | ---- | ----------------------------------------------------------- |
| Client UI | `apps/client/`  | 3000 | React 19, Vite 7, OpenLayers 10, MUI v7, TypeScript         |
| Admin UI  | `apps/admin/`   | 3001 | React 16 (legacy), Create React App 3, MUI v4, OpenLayers 5 |
| Backend   | `apps/backend/` | 3002 | Node.js ESM, Express 5                                      |

## User documentation

End-user documentation can be found in [Hajk's Wiki](https://github.com/hajkmap/Hajk/wiki). Writing user documentation is a very important way of contributing to the project and suits well for organizations that wish to contribute but lack coding capabilities.

## Design guidelines

Hajk is built using **Material Design** components from the [Material UI](https://material-ui.com/) project. Make sure to familiarize yourself with all the available components. It is crucial for the user experience that the design principles are followed throughout the system.

## Local development setup

Start apps in this order:

1. **Backend**

   ```bash
   cd apps/backend
   cp .env.example .env   # edit as needed
   npm install
   npm run dev            # http://localhost:3002
                          # API Explorer: http://localhost:3002/api-explorer/
   ```

2. **Client UI**

   Ensure `apps/client/public/appConfig.json` has `mapserviceBase: "http://localhost:3002/api/v2"`.

   ```bash
   cd apps/client
   npm install
   npm run dev   # http://localhost:3000
   ```

3. **Admin UI** (optional)

   Ensure `apps/admin/public/config.json` URLs point to `http://localhost:3002/api/v2/...`.

   ```bash
   cd apps/admin
   npm install
   npm start     # http://localhost:3001
   ```

## Build commands

```bash
# Backend: compile to dist/
cd apps/backend && npm run compile && npm start

# Client: build to build/
cd apps/client && npm run build

# Admin: build to build/ (OpenSSL legacy provider handled by npm scripts)
cd apps/admin && npm run build
```

## Git workflow

Hajk enforces the **Git Feature Branch Workflow** as described in [this document](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow).

### Steps

1. **Create a GitHub issue.** You will need the issue number for your branch name.
1. `git fetch` and `git checkout develop` and `git merge` to get the latest.
1. Create a branch: `git checkout -b feature/1234-blue-button` (use your issue number and a short description).
1. Set upstream: `git push --set-upstream origin feature/1234-blue-button`
1. Code, commit, and push regularly:

   ```bash
   git commit -S -m "A good commit message"
   git push
   ```

   (The `-S` flag [signs your commit](https://help.github.com/en/articles/signing-commits), which is strongly recommended.)

1. **Regularly merge `develop` into your branch** to stay up to date:

   ```bash
   git stash && git checkout develop && git fetch && git merge \
     && git checkout feature/1234-blue-button && git merge develop && git stash apply
   ```

1. Add a line to `CHANGELOG.md` under the **Unreleased** section:

   ```markdown
   - area: Short explanation. [#1234](https://github.com/hajkmap/Hajk/issues/1234)
   ```

   Use `Added`, `Fixed`, `Changed`, or `Security` subsections as appropriate. `area` can be a plugin name (Sketch, Print…) or app name (Admin, Backend, Client) or general (Core, Bug).

1. Open a pull request on GitHub targeting the `develop` branch.

## Code standards

The **Client** and **Backend** use ESLint 9 + Prettier. The **Admin** uses Prettier only.

Run `npm run lint:fix` in the relevant app directory before committing. Code that does not pass linting will not be accepted.

Additional conventions for the Client:

- Prefer functional components with hooks over class components.
- Use TypeScript interfaces for prop types.
- Keep components focused — aim for under 200 lines.
- Backend uses ES module syntax throughout; do not use CommonJS `require()`.

The recommended editor setup is VSCode with the ESLint and Prettier extensions, with `formatOnSave: true` enabled.
