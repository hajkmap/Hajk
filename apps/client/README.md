## Hajk Client

Hajk Client is the end-user web map application for Hajk. It is built with React, Material UI, and OpenLayers, and now runs with Vite.

## Development

```bash
# Assumes your in this app's root, i.e. <repo-root>/apps/client
npm install
npm run dev
```

The app runs on `http://localhost:3000` by default.

## Configuration

Update `apps/client/public/appConfig.json` to point to your backend (see `mapserviceBase`). By default, it points to the Hajk backend running on `http://localhost:3002`.

## Build for deployment

```bash
npm run build
```

This will create a `build` directory with the compiled application.

## Preview the build locally

```bash
npm run preview-build
```
