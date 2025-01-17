# ROADMAP admin

## List of sprints

- [2025-01-31](#2025-01-31)

## 2025-01-31

- [ ] Authentication and authorization
  - [x] Basic authentication (local user and pass)
  - [ ] Authentication against Azure Entra (HH)
  - [ ] [Roles](#roles)
- [ ] Services API
  - [ ] Update prisma schema
  - [ ] Update seed script
  - [ ] Update zod parsers(AA)
    - [x] Services (field validators are missing)
    - [ ] Users
  - [ ] Update API methods
- [ ] Layers API
  - [ ] Update prisma schema
  - [ ] Update seed script
  - [ ] Update zod parsers
  - [ ] Update API methods
- [ ] Services page
  - [x] Add service (AA)
  - [x] Alter service (AA)
    - ⚠️ Note: Some fields in the request payload for both adding and updating a service are mocked or incomplete due to missing data in the current data model. Once the data model is finalized, ensure that the missing fields are updated and validated in both the payload and the backend schema.
  - [x] Remove service (AA)
- [ ] Layers page
  - [ ] Add layer
  - [ ] Alter layer
  - [ ] Remove layer
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
- [x] Upgrade npm packages (JW)

### Roles

_TODO: Document roles used in Hajk._

### Ready for testing after [2025-01-31](#2025-01-31)

- [ ] (Example) Test authentication
- [ ] Test adding, updating and deleting a new service
