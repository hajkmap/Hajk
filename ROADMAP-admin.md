# ROADMAP admin

## 2026-01-28 - Teams meet-up

Today's discussion resulted in the following decisions:

- Ensure to always set a default value for JSONB objects from Prisma. As this can't be done in prisma.schema, we'll do it in application logic, by doing a deep merge with our default values + database values on top of that.
- Move all stuff in the PG columns into the `options` column that belong to the application data (including things like `name` in Layer). The only columns that should stay directly in the tables are those that are related to the API and Backend itself - not application data - e.g. `id`, `lastUpdated`, etc. Also, columns that refer to other tables should be left as-is due to database normalization rules (e.g. `Map` table should still have the `projections` column).
- The API response must always be full, include default values for everything that's missing. To implement this one should proceed by checking the current default value we use for a given property in Client and add it into the new default object. We export all defaults from one file with constants (`server/common/defaults.ts`).

## List of sprints

- [2025-03-28](#2025-03-28)

## 2025-03-28

- [ ] Authentication and authorization
  - [x] Basic authentication (local user and pass)
  - [ ] Authentication against Azure Entra (HH)
  - [ ] [Roles](#roles)
- [ ] Services API
  - [x] Update prisma schema (ALL)
  - [x] Update seed script (HH)
  - [ ] Update zod parsers
  - [x] Update API methods (AA)
  - [ ] Try getting onDelete cascade to work for relations as intended inside the prisma schema
- [ ] Layers API
  - [x] Update prisma schema (ALL)
  - [x] Update seed script (HH)
  - [ ] Update zod parsers
  - [x] Update API methods (AA)
  - [ ] Try getting onDelete cascade to work for relations as intended inside the prisma schema
- [ ] Groups API
  - [x] Update prisma schema (AA)
  - [x] Update seed script (HH)
  - [ ] Update zod parsers
  - [x] Update API methods (AA)
- [ ] FormActionPanel component (OS)
  - [x] Make the panel sticky (OS)
  - [ ] Feed it with relevant data
- [x] Services page
  - [x] Add service (AA)
  - [x] Alter service (AA)
  - [x] Remove service (AA)
  - [x] Bugfix: MUI Data Grid checkbox selection issue with separate search field (OS/AA)
  - [ ] TBD: Define proper implementation for the "Workspace" input field
- [x] Layers page
  - [x] Add layer (AA)
  - [x] Alter layer (AA)
    - ⚠️ Note: Used in maps data-grid are incomplete and needs to be updated.
  - [ ] TBD: Infoclick preview
  - [x] Remove layer (AA)
  - [x] MUI chip component and legend to showcase affected layers in the available layers data-grid (AA)
- [ ] Groups page
  - [x] Add group (AA)
  - [x] Alter group (AA)
  - [x] Delete group (AA)
  - [ ] TBD/TBI: Drag-and-drop functionality for ordering the layers in the layerswitcher.
  - [x] react-dnd dependency with a simple dnd component (dummy) (AA)
- [ ] Map settings page
  - [x] Step 1: Create form with formfactory, UI only, incl translations (JA)
- [ ] Optimizing input fields performance/state.
  - [x] Services page (JA)
  - [x] Layers page (JA)
- [ ] General UI improvements
  - [ ] Use page width better. 1024? 2048?
  - [x] Handle menu overflow and bottom settings/lock better. v0.1 WIP (JA)
  - [x] Split up theme into multiple parts. Prepared typography to be able to adjust easier. (JA)
  - [x] Force default size to small of some Mui components to make it more compact. (JA)
  - [x] Add GlobalStyles to ba able to modify FormFactory styles separately. (JA)
  - [x] Adjust header sizes for Page etc. v0.1 WIP (JA)
  - [x] Fix FormFactory styles for Accordion/Paper/inputs etc. v0.1 WIP (JA)
  - [x] FormFactory Accordion should show some existing data when collapsed, and more data in tooltip. (JA)
  - [x] Fix nested Grids in form factory (when adding help icon etc). (JA)
  - [x] Add the possibility to add unmanaged elements to a FormFactory form. (JA)
  - [x] Find cause and fix sluggish form updates. (JA)
  - [x] Add a color picker component to FormFactory. v0.1 WIP (JA)
  - [x] Fix RadioButtonGroup in FormFactory (JA)
  - [x] Add search to FormFactory and some refactoring (Massive changes) (JA)
- [x] Upgrade npm packages (JW)

### Roles

_TODO: Document roles used in Hajk._

### Ready for testing after [2025-03-28](#2025-03-28)

- [ ] (Example) Test authentication
- [ ] Test adding, updating and deleting a new service
- [ ] Test adding, updating and deleting a new layer
