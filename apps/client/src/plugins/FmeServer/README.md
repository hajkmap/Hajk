# FME-Server Plugin

The main purpose for this plugin is to run FME-workspaces that are published to an FME server.
The plugin allows for both Data-download (targeting `/fmeproxy/fmedatadownload/repository/workspace`) as well as running jobs via the FME REST API. The REST API version (v3 or v4) is detected automatically on first use by probing the FME server (v4 first, then v3). See the [FME Flow REST API v4 docs](https://docs.safe.com/fme/html/fmeapiv4/docs/index.html) for endpoint differences.

- **v3**: `/fmeproxy/fmerest/v3/...` — transformations submit and job status endpoints.
- **v4** (FME Flow 2025.1+): `/fmeproxy/fmeapiv4/...` — `POST /jobs` and `GET /jobs/{id}`; parameters via `GET /workspaces/{repository}/{workspace}/parameters`.

Data-download always uses `/fmedatadownload/` regardless of REST API version.

### Parameter type handling (single source of truth)

The v3 REST API and the v4 JSON UI describe parameters with different type names
(`CHOICE` vs `dropdown`, `LISTBOX` vs `listbox`, `RANGE_SLIDER` vs `range`, …).
Rather than aliasing v4 names back to v3 names and then re-classifying them, the
plugin classifies every raw type **once**:

- `api/parameterUi.ts` holds a single flat `KIND_BY_TYPE` record mapping each FME
  parameter type (v3 + v4, normalized to `SCREAMING_SNAKE`) to a `ParameterUiKind`
  - the control the plugin renders it with. `resolveParameterUiKind` also uses the
    v4 `valueType` hint to refine generic text fields into numbers/booleans, and
    unknown types fall back to a plain text input.
- `api/publishedParameters.ts` runs this once during normalization and stores the
  result on `PublishedParameter.uiKind`. Rendering (`ParameterField`) and value
  extraction (`parameterValues`) switch on `uiKind` and never re-parse type
  strings. Adding a new type means one entry in one map.

Job status is normalized the same way: `api/jobs.ts` maps v4 (lowercase) status
spellings onto the canonical FME statuses (`SUCCESS`, `FME_FAILURE`,
`JOB_FAILURE`, `ABORTED`, `QUEUED`, `RUNNING`, `SUBMITTED`, `PULLED`); v3 is passed
through unchanged.

### Code structure

| Path                            | Role                                                       |
| ------------------------------- | ---------------------------------------------------------- |
| `types.ts`                      | Shared types for the plugin                                |
| `api/version.ts`                | Detects v3 vs v4 against the FME server                    |
| `api/endpoints.ts`              | Builds proxied REST URLs                                   |
| `api/publishedParameters.ts`    | Normalizes workspace parameters for the UI                 |
| `api/parameterUi.ts`            | Single map from FME type → UI control (`uiKind`)           |
| `api/parameterValues.ts`        | Resolves values sent to FME when ordering                  |
| `api/jobs.ts`                   | Submit body and job status helpers                         |
| `hooks/useFmeApiVersion.ts`     | React hook wrapping API version detection                  |
| `hooks/useFmeServerApi.ts`      | REST calls (parameters, orders, job status)                |
| `hooks/useProductParameters.ts` | Loads parameters when group/product changes                |
| `models/FmeServerModel.ts`      | Product config, validation, and payload building (no HTTP) |
| `models/MapViewModel.ts`        | Map drawing and geometry handling                          |

### Further development

Ideas for the future:

- Add possibility to extract all features from the draw-layer, so that these could be sent to FME-server

Feel free to add more!

## Setup

There are a few steps that an admin must complete before the plugin will function:

- Add a user to FME-server that can access and run workspaces in some repository.
- Enter details about the FME-server instance and the user created above in the `.env` file (located in `apps/backend`).
- Enable the plugin in the admin-UI.
- Add a couple of products (workspaces) in the admin-ui.
- Make sure that everything works!

### The admin-UI

In the admin-UI, the administrators can add and remove products. Unfortunately, the admin-UI does not allow for editing of already added products. (Which means that the admin must remove the old product, then add it again with the new value if they want to change anything). There are a few settings on the products that might need some explanation:

- Name: The name of the product
- Group: Which group should the product belong to?
- Repository: In which repository is the workspace located?
- Workspace: Which workspace should the product target?
- geoAttribute: Which published parameter should we save the geometry to? (If no geometry is needed, set "none").
- maxArea: To avoid killing the FME-server instance, we allow for a max area for the drawn geometries (-1 can be used for no restrictions).
- infoUrl: If set, the plugin will display an IconButton pointing to the url supplied.
- availableForGroups: Set to comma-separated string of AD-groups if some products should only be visible for some users.

The admin-UI fetches information such as available repositories and workspaces (for the user specified in the .env-file) automatically to simplify the work for the administrators.

## Usage

The plugin is (should) be really simple to use. it is based on the idea of a stepper, where the user can move on only when they have completed the step they are on. The stepper should lead to a minimum of errors in the end, since we can force the user to make good choices.
