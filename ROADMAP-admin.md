# ROADMAP admin

## List of sprints

- [2025-02-21](#2025-02-21)

## 2025-02-21

- [ ] Authentication and authorization
  - [x] Basic authentication (local user and pass)
  - [ ] Authentication against Azure Entra (HH)
  - [ ] [Roles](#roles)
- [ ] Services API
  - [x] Update prisma schema (HH)
  - [x] Update seed script (HH)
  - [ ] Update zod parsers
  - [x] Update API methods (AA)
- [ ] Layers API
  - [x] Update prisma schema (HH)
  - [x] Update seed script (HH)
  - [ ] Update zod parsers
  - [x] Update API methods (AA)
- [ ] FormActionPanel component (OS)
  - [ ] Make the panel sticky (OS)
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
  - [x] Remove layer (AA)
    - ⚠️ Note: legend and legendUrl fields are incomplete. The permission accordion and used in maps data-grid are also incomplete and needs to be updated.
- [ ] Map settings page
  - [ ] Step 1: Create form with formfactory, UI only [JA]
- [ ] Optimizing input fields performance/state.
  - [x] Services page (JA)
  - [x] Layers page (JA)
- [ ] General UI improvements (JA)
  - [ ] Use page width better. 1024? 2048?
  - [x] Handle menu overflow and bottom settings/lock better. v0.1 WIP
  - [x] Split up theme into multiple parts. Prepared typography to be able to adjust easier.
  - [x] Force default size to small of some Mui components to make it more compact.
  - [x] Add GlobalStyles to ba able to modify FormFactory styles separately.
  - [x] Adjust header sizes for Page etc. v0.1 WIP
  - [x] Fix FormFactory styles for Accordion/Paper/inputs etc. v0.1 WIP
  - [x] FormFactory Accordion should show some existing data when collapsed, and more data in tooltip.
  - [x] Fix nested Grids in form factory (when adding help icon etc).
  - [x] Add the possibility to add unmanaged elements to a FormFactory form.
  - [x] Find cause and fix sluggish form updates.
  - [x] Add a color picker component to FormFactory. v0.1 WIP
- [x] Upgrade npm packages (JW)

### Roles

_TODO: Document roles used in Hajk._

### Ready for testing after [2025-02-21](#2025-02-21)

- [ ] (Example) Test authentication
- [ ] Test adding, updating and deleting a new service
- [ ] Test adding, updating and deleting a new layer
