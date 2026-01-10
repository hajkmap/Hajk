# AI Agent Instructions for Hajk

Hajk is an open-source web GIS solution based on React, Material UI, and OpenLayers. This guide outlines key architectural patterns and workflows to help AI agents effectively contribute to the codebase.

## Project Architecture

### Core Components

- **Client UI** (`apps/client/`): Web map frontend application, running on port 3000
- **Admin UI** (`apps/admin/`): Configuration frontend for Client UI, running on port 3001
- **Backend** (`apps/backend/`): REST API server (Node.js) consumed by both UIs, running on port 3002

### Critical Configuration Files

- `apps/client/public/appConfig.json`: Client UI backend configuration
- `apps/admin/public/config.json`: Admin UI backend configuration
- `apps/backend/.env`: Backend environment configuration
- `apps/backend/App_Data/`: Map and layer configurations

## Development Workflow

### Setup Flow

1. Start backend first:

   ```bash
   cd apps/backend
   npm install
   npm run dev   # Runs on http://localhost:3002
   ```

1. Configure and start client:

   ```bash
   # Edit apps/client/public/appConfig.json to point to backend
   cd apps/client
   npm install
   npm start     # Runs on http://localhost:3000
   ```

1. Configure and start admin (optional):

   ```bash
   # Edit apps/admin/public/config.json - use /mapconfig endpoints
   cd apps/admin
   npm install
   npm start     # Runs on http://localhost:3001
   ```

### Git Workflow Conventions

1. Always branch from `develop`
2. Branch naming: `feature/ISSUE_NUM-description` (e.g., `feature/1234-blue-button`)
3. Update CHANGELOG.md under "Unreleased" with format:

   ```markdown
   - area: Description. [#issue-number](https://github.com/hajkmap/Hajk/issues/issue-number)
   ```

## Code Patterns

### Design Principles

- Use Material UI components following Material Design principles
- Component reference: [Material-UI](https://material-ui.com/)
- Follow ESLint & Prettier configurations in `client/` and `backend/`
- Prefer functional components with hooks over class components
- Keep components focused and modular - aim for under 200 lines
- Use TypeScript interfaces for prop types

### Common Integration Points

- Backend API paths:
  - Client UI: `/api/v2/`
  - Admin UI: `/api/v2/mapconfig/` for admin operations
  - ActiveDirectory auth impacts `/config` vs `/mapconfig` responses

### Debugging Tips

- Backend debug mode: `npm run dev:debug`
- Client/Admin: Standard Create React App debugging
- Check `mapserviceBase` in configs when APIs aren't responding
- Use React DevTools for component inspection
- OpenLayers map debugging: `window.olMap.getLayers().getArray()`

## Key Files for Context

- `apps/client/src/` - Main client application code
- `apps/admin/src/` - Admin interface code
- `apps/backend/server/` - Backend server implementation
- `apps/backend/App_Data/*.json` - Map configuration files

## Common Workflows

### Adding New Features

1. Determine if changes needed in client, admin, or backend
2. Update appropriate configuration files
3. Follow Material Design patterns for UI components
4. Add appropriate tests
5. Update documentation
