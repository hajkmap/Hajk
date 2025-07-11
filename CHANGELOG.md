<!-- markdownlint-disable MD024 - because we want to duplicate headings, such as Added or Fixed.-->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- ## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security -->

## [4.1.0] - 2025-06-18

### Fixed

- LayerComparer: Corrected layer comparison logic in onClose handler. [commit](https://github.com/hajkmap/Hajk/commit/7f85c143055f1648a3033588a9462a902af4dea5)

## [4.1.0-rc.1] - 2025-04-25

### Added

- Sketch: Added GPX import and export. [PR#1641](https://github.com/hajkmap/Hajk/pull/1641)
- Sketch/Measurer: Disable snapping temporarily on keyDown (Space) ([issue](https://github.com/hajkmap/Hajk/issues/1616))
- DocumentHandler: Now possible to add map-link that opens corresponding plugin (with/without enableAppStatInHash) ([issue](https://github.com/hajkmap/Hajk/issues/1613))

### Removed

- Backend: Packages related to testing were never really used. [commit](https://github.com/hajkmap/Hajk/commit/934ba9780d2e57e60cde19f8341db49bcc6103e7) and [commit](https://github.com/hajkmap/Hajk/commit/8029c0b45dd38107acca3a47607f48d504dfd716)

### Fixed

- LayerSwitcher: UX Improvements ([issue](https://github.com/hajkmap/Hajk/issues/1637))
- LayerSwitcher: Now possible to render special layers at the bottom [PR#1648](https://github.com/hajkmap/Hajk/pull/1648)
- Core: Fixed a bug where the application would crash and leave user with a blank screen in the unlikely condition of a vector layer being configured in such a way that the URL for fetching SLD for styling that layer would become unavailable. [commit](https://github.com/hajkmap/Hajk/commit/af17bc7e8e0af618d306b6c3ce4dfad660531e0a)

### Security

- Backend: Major upgrades of dependencies, e.g. the latest Express, HTTP Proxy Middleware, ESlint. [commit](https://github.com/hajkmap/Hajk/commit/64877fb4ed70d4a8829babc8ea126da4aee8d062)

## [4.0.0] - 2025-04-04

### Fixed

- Client: Hotfix for [Window management fix](https://github.com/hajkmap/Hajk/pull/1629), see
  [commit](https://github.com/hajkmap/Hajk/commit/d96bda0091358c25164918e4f14a159aad543d41).
- Docker: Minor fixes to the Dockerfile, [commit](https://github.com/hajkmap/Hajk/commit/2cc601008296edbbedaa985b7411334d2766fe32).
- Config: fixes in naming of the demo config's DocumentHandler section, [commit](https://github.com/hajkmap/Hajk/commit/d2109c5dc6a68e2fa4018123fae50cdd4e02c132).
- Client: Hotfix for loading with malformed coordinates. [commit](https://github.com/hajkmap/Hajk/commit/1ab25f09d23aee1608ba240be3888d3450cb9735)
- LayerSwitcher: Fix to ensure consistent labeling. [PR#1632](https://github.com/hajkmap/Hajk/pull/1632)
- LayerSwitcher: Hotfix for tooltip getting stuck. [commit](https://github.com/hajkmap/Hajk/commit/dd220226d238a428562a1fb4b808a9e96b259994)
- Client: Enable hash control over individual sub-layers. [PR#1635](https://github.com/hajkmap/Hajk/pull/1635)

## [4.0.0-rc.2] - 2025-03-26

### Fixed

- LayerSwitcher: Multiple hotfixes:
  ([commit](https://github.com/hajkmap/Hajk/commit/4d9b0ace9cbf029423e4ac836316a5272acfcf84))
  ([commit](https://github.com/hajkmap/Hajk/commit/5371fa8fda0bba13191bccfbaf5f78a2f2c502b3))
  ([commit](https://github.com/hajkmap/Hajk/commit/7576d013852a2e9850ee6b4f05477a742a331be8))
  ([commit](https://github.com/hajkmap/Hajk/commit/46d1034b01a060dc5c2efc512de9b6c30d005198))
  ([commit](https://github.com/hajkmap/Hajk/commit/4d9b0ace9cbf029423e4ac836316a5272acfcf84))
  ([commit](https://github.com/hajkmap/Hajk/commit/337b950fcf82e55bfa181fb379a0bb1e1ce2cd69))
- LayerSwitcher: Dialog click-and-drags moves LayerSwitcher's window below. ([issue](https://github.com/hajkmap/Hajk/issues/1600))
- Updates to RHEL Dockerfile. ([commit](https://github.com/hajkmap/Hajk/commit/afe44edd51452035d660d9f3ae99a298550ccabb))
- Presets: Bugfix ([commit](https://github.com/hajkmap/Hajk/commit/e296c10fca9383819ac5b46810ce55db25c8ff6a))
- LayerSwitcher: Sublayers in hash (app state). ([issue](https://github.com/hajkmap/Hajk/issues/1603))
- LayerSwitcher: Fixed scrolling issue. ([issue](https://github.com/hajkmap/Hajk/issues/1604))
- LayerSwitcher: Sublayers visible among Quick Access layers. ([issue](https://github.com/hajkmap/Hajk/issues/1605))
- Admin: Bugfix for warning when editing in Document Handler editor. ([issue](https://github.com/hajkmap/Hajk/issues/1606))
- LayerSwitcher: Fix for missing sublayers' legend. ([issue](https://github.com/hajkmap/Hajk/issues/1607))
- LayerSwitcher: Restored automatic layer rotation functionality. ([issue](https://github.com/hajkmap/Hajk/issues/1614))
- LayerSwitcher: ensure to respect the `hideExpandArrow` setting. ([issue](https://github.com/hajkmap/Hajk/issues/1617))
- Buffer and Measurer bug fixes. ([commit](https://github.com/hajkmap/Hajk/commit/44ea3549b9f79c47baf3d6be41036d5f8435ce82) and [commit](https://github.com/hajkmap/Hajk/commit/c4e1827b7dffe5f93d554670a2751ef10bc883d8))
- LayerSwitcher: hotfix to synchronize key naming between Admin and Client, effectively enabling the Quick Access Presets functionality. ([PR](https://github.com/hajkmap/Hajk/pull/1621))
- LayerSwitcher: Toggle sublayers when loading Quick Access presets. ([PR](https://github.com/hajkmap/Hajk/pull/1623))
- LayerSwitcher: Fix for fitting the legend graphics. ([commit](https://github.com/hajkmap/Hajk/commit/432fe3ba528154f553d771527aab301d0666dfe9)
- LayerSwitcher: Fix for storing the Theme Presets in LocalStorage. ([PR](https://github.com/hajkmap/Hajk/pull/1625))
- Client/General: Refinement of Window management. ([PR](https://github.com/hajkmap/Hajk/pull/1629))
- DocumentHandler/Admin: Now possible to edit TOC on document level. ([PR](https://github.com/hajkmap/Hajk/pull/1626))

## [4.0.0-rc.1] - 2025-02-19

### Added

- Search: Added possibility to set default search options via admin UI. PR: [#1496](https://github.com/hajkmap/Hajk/pull/1496)
- LayerComparer: It is now possible for to select specific layers (in Admin) that will be visible in the tool. Previously only all background layer and/or all regular layers could be selected. [#1570](https://github.com/hajkmap/Hajk/issues/1570)

#### Major LayerSwitcher changes

- 🚀 Filter functionality in LayerSwitcher.
- Enhanced layer visibility indicators in LayerSwitcher.
- Quick Access grouping in LayerSwitcher for access to frequently used layers.
  With support for saving/recall of sets of "QuickAccess layers" to
  LocalStorage.
- Quick Access Layer Presets/Themes/Packages
  Choose from ready made sets of Layers to load into the Quick Access
  section. The Presets/Themes/Packages are set up in the map config. See
  example in `simpleMapConfig.json`.
- Improved DrawOrder tab functionality for managing layer drawing order.
- LayerSwitcher Actions Menu (including scrolling actions).

For details see the following issues:

- [#1237](https://github.com/hajkmap/Hajk/issues/1237)
- [#1275](https://github.com/hajkmap/Hajk/issues/1275)
- [#1284](https://github.com/hajkmap/Hajk/issues/1284)
- [#1296](https://github.com/hajkmap/Hajk/issues/1296)
- [#1300](https://github.com/hajkmap/Hajk/issues/1300)
- [#1347](https://github.com/hajkmap/Hajk/issues/1347)
- [#1365](https://github.com/hajkmap/Hajk/issues/1365)
- [#1380](https://github.com/hajkmap/Hajk/issues/1380)
- [#1594](https://github.com/hajkmap/Hajk/pull/1594)

### Fixed

- Improved how overlapping plugins are handled. PR: [#1546](https://github.com/hajkmap/Hajk/pull/1546)
- Several accessability improvements. PRs: [#1561](https://github.com/hajkmap/Hajk/pull/1561), [#1562](https://github.com/hajkmap/Hajk/pull/1562), [#1563](https://github.com/hajkmap/Hajk/pull/1563), [#1565](https://github.com/hajkmap/Hajk/pull/1565), [#1566](https://github.com/hajkmap/Hajk/pull/1566), [#1567](https://github.com/hajkmap/Hajk/pull/1567), [#1569](https://github.com/hajkmap/Hajk/pull/1569)
- Admin: Fixed issue with naming of the FME Server configuration property ([commit](https://github.com/hajkmap/Hajk/commit/98b9280b56a05eaa2a037359341329ed5fc46f8e)

### Removed

- In accordance with [the roadmap](https://github.com/hajkmap/Hajk/blob/master/ROADMAP.md) the .NET backend was removed in the 4.0 release. ([commit](https://github.com/hajkmap/Hajk/commit/5c50105cc3fa957967196f7fc321bf5827772e7c))

## [3.14.1] - 2024-10-09

### BREAKING

- PropertyChecker: The configuration field `digitalPlanItemDescriptionAttribute` has been renamed to `digitalPlanItemDescriptionAttributes` and holds now an array of objects rather than a string. For details, refer to [example configuration in the plugin's README](https://github.com/hajkmap/Hajk/blob/master/apps/client/src/plugins/PropertyChecker/readme.md#example-configuration).

### Added

- Backend (Node): Added (very) limited userDetails to response when using the AD Header approach (for example NodeHoster). [#1534](https://github.com/hajkmap/Hajk/pull/1534)
- LayerComparer: Made it easier to change which layers are being compared. [#1543](https://github.com/hajkmap/Hajk/pull/1543)
- Measurer: The measurer now allows for selecting objects by clicking them to get measurement information (area and circumference). PR: [#1532](https://github.com/hajkmap/Hajk/pull/1532).

### Fixed

- Bug fix associated to the issue #1310 and PR #1460. [#1536](https://github.com/hajkmap/Hajk/pull/1536)

### Changed

- Replaced the module used by the Plausible tracker in order to support some new features and fix bugs with the official tracker. See discussion in [#1535](https://github.com/hajkmap/Hajk/issues/1535).

## [3.14.0] - 2024-09-01

### BREAKING

- This release marks the removal of the legacy V1 API (`/api/v1`) in both the NodeJS backend and the old .NET 4.5 backend (refer to the _Removed_ section below). Client UI is now V2-compatible only, as it requires the consolidated loading method. This means that you need to review and update your configuration, both regarding Client and Admin. Please refer to `docs/migrate-to-v2-api.md` for details.
- This release marks deprecation of some plugins that either became replaced by a new solution or transformed into a community plugin. Refer to `docs/deprecated-plugins.md` for details.
- Although not exactly a _breaking_ change, but it fits well here: **the repo has been restructured**. All apps can now be found in the `apps/` directory. The `new-` prefix has been removed from apps' names. Some shell scripts now live in `scripts/` while the majority of Docker-related files, except for the official Dockerfile, have been moved into the `Docker/` directory. PR: [#1488](https://github.com/hajkmap/Hajk/pull/1488)

### Added

- Cookie: It's now possible to revisit the cookie notice and change your preference [#1125](https://github.com/hajkmap/Hajk/issue/1125)
- Sketch: It is now possible to buffer from the Sketch plugin. [#1310](https://github.com/hajkmap/Hajk/issues/1310)
- Sketch: The user now has the option to reset to default styling and choose from a wider range of colors in the color picker; additionally, black and white options have been added. [#1372](https://github.com/hajkmap/Hajk/issues/1372)
- Core, Admin: Added support for stand-alone GeoWebCache WMS Server. Issue: [#1469](https://github.com/hajkmap/Hajk/issues/1469), PR: [#1493](https://github.com/hajkmap/Hajk/pull/1493).
- Print/Anchor: It's now possible to generate QR codes in Share and Print. [#1482](https://github.com/hajkmap/Hajk/issues/1482)
- Sketch: It's now possible to disable stroke for polygons and circles [#1177](https://github.com/hajkmap/Hajk/issues/1177)
- Backend: The new .NET 6 backend. Issue: [#1210](https://github.com/hajkmap/Hajk/issues/1210). PR: [#1395](https://github.com/hajkmap/Hajk/pull/1395).
- Core: Allow to specify map config by using `m` query parameter, even when no backend is active. [commit](https://github.com/hajkmap/Hajk/commit/eb5be276437994c86c2edd5abef3ea21cd6071b4)
- Deployment: Added Dockerfile making it possible to deploy "Hajk-simple" on OpenShift using S2I. PR: [#1487](https://github.com/hajkmap/Hajk/pull/1487).
- TimeSlider: It's now possible to print images of the content generated in the TimeSlider plugin. PR: [#1492](https://github.com/hajkmap/Hajk/pull/1492).
- Core: CSS classes added for certain elements, allows for more granular custom styling. See also this [discussion](https://github.com/hajkmap/Hajk/discussions/1481). PR: [#1497](https://github.com/hajkmap/Hajk/pull/1497).
- Coordinates: in addition to changing the icon's name (URL), it is now also possible to set icon's scale and anchor values. PR: [#1499](https://github.com/hajkmap/Hajk/pull/1499).
- Admin UI: It is now possible to easily duplicate map configurations using the UI. [#1502](https://github.com/hajkmap/Hajk/issues/1502).
- Coordinates: It's now possible to copy and paste coordinates from/to both coordinate inputs (N & E, longitude & latitude). PR: [#1506](https://github.com/hajkmap/Hajk/pull/1506).
- LayerSwitcher(Client)/Groups(Admin): It's now possible to add and show information about a layer group. [#400](https://github.com/hajkmap/Hajk/issues/400).
- LayerSwitcher: Some text field inputs for layer groups now allows HTML code. [#1518](https://github.com/hajkmap/Hajk/pull/1518).
- CookieNotice: The cookie notice dialog now appears at the top of other dialogs and pop up windows. PR: [#1521](https://github.com/hajkmap/Hajk/pull/1521).
- Backend (Node): Added possibility to use Authorization token in FME Server proxy. [#1530](https://github.com/hajkmap/Hajk/pull/1530).

### Fixed

- Add conditional rendering for Control button. [Commit.](https://github.com/hajkmap/Hajk/commit/b34def3249b368de336a5c4eadd86318103e78fb)
- Restore cross-platform build for NodeJS backend. [#1484](https://github.com/hajkmap/Hajk/pull/1484)
- Bug fix associated to #1468. [#1485](https://github.com/hajkmap/Hajk/pull/1485)
- Admin UI is now compatible with the correct HTTP verbs (`DELETE` and `PUT`). [#1501](https://github.com/hajkmap/Hajk/pull/1501)
- Cookie: Cookie Notice updated after browser refresh. Fix to PR: [#1509](https://github.com/hajkmap/Hajk/pull/1509)
- FIR plugin - Pagination now remembers page after delete. [#1514](https://github.com/hajkmap/Hajk/pull/1514)
- Fix collapsed InfoClick in Iframe [#1508](https://github.com/hajkmap/Hajk/pull/1508)
- Prevent multiple animations in Location plugin [#1525](https://github.com/hajkmap/Hajk/pull/1525)

### Security

- Bumped dependencies in Client.
- The official Dockerfile build on an image based on current Node LTS (v20).

### Removed

- The legacy .NET 4.5 backend. For reference, check out the [legacy-dotnet-4.5-backend branch](https://github.com/hajkmap/Hajk/tree/legacy-dotnet-4.5-backend).
- V1 API from NodeJS Backend.

## [3.13.25] - 2024-02-13

### Added

- Sketch: Rotate drawn objects. [#1455](https://github.com/hajkmap/Hajk/issues/1455)
- Sketch: Allow changing point size. [#1373](https://github.com/hajkmap/Hajk/issues/1373)
- FIR: Allow comma-separated search and multiline search. [#1461](https://github.com/hajkmap/Hajk/issues/1461)
- Infoclick: Highlight in collection view. [#1472](https://github.com/hajkmap/Hajk/issues/1472)

### Fixed

- Sketch: Solved save error with arrow object. [#1450](https://github.com/hajkmap/Hajk/issues/1450)
- DocumentHandler: Fixed Blockquote and Accordion issues in dark mode. [#1457](https://github.com/hajkmap/Hajk/issues/1457)
- KIR: Now checks if export is allowed. [#1441](https://github.com/hajkmap/Hajk/issues/1441)
- Infoclick: Resize breaks scroll. [#1428](https://github.com/hajkmap/Hajk/issues/1428)

### Changed

- Infoclick: Enhance `roundToDecimals` filter. [#1445](https://github.com/hajkmap/Hajk/issues/1445)

## [3.13.24] - 2024-01-17

### Added

- LayerSwitcher: It is now possible to auto-rotate the Map to a admin-specified value. Useful for layers with photos taken in different directions. [#1451](https://github.com/hajkmap/Hajk/issues/1451)

## [3.13.23] - 2024-01-17

_A quick follow-up to 3.13.22, that had some issues with certain map configurations._

### Fixed

- Backend: Solved an issue that could stop certain maps from loading if a tool's option's property value was `null`. Introduced in [#1438](https://github.com/hajkmap/Hajk/issues/1438), fixed in [77503ee](https://github.com/hajkmap/Hajk/commit/77503ee617b1579970cb2ea95c7b95143d024df0).

### Added

- FeatureInfo: New filters. [#1443](https://github.com/hajkmap/Hajk/issues/1443)

### Changed

- Backend: show 403 Forbidden rather than 500 if access was not allowed. [98b9280](https://github.com/hajkmap/Hajk/commit/98b9280b56a05eaa2a037359341329ed5fc46f8e)

## [3.13.22] - 2024-01-16

### Added

- DocumentHandler - possible to save documents inside subfolders. [#1402](https://github.com/hajkmap/Hajk/pull/1402)
- Backend: Another method of gaining AD groups has been added. It's possible to circumvent the current solution (where Backend talks to the LDAP server) if one's setup allows for getting the AD groups elsewhere (i.e. from a proxy if setup on IIS). [#1439](https://github.com/hajkmap/Hajk/issues/1439)
- Backend: Respect nested `visibleForGroups` within tool options. [#1438](https://github.com/hajkmap/Hajk/issues/1438)
- Backend: show 403 Forbidden rather than 500 if access was not allowed. [90b1725](https://github.com/hajkmap/Hajk/commit/90b172595c16078053c2d03130971e89091511aa)
- Edit: Allow setting a `geometryField` for edit layers with no features. [#1447](https://github.com/hajkmap/Hajk/issues/1447)
- PropertyChecker: Expanded the plugin to also utilize _Digital Plans_ by adding a second tab with an own list as well as another report.

### Fixed

- Client core: Fix layout issue with hidden DrawerToggleButtons [#1436](https://github.com/hajkmap/Hajk/pull/1436)
- PropertyChecker: Better sorting and layer loading failed indicator in layers list. [8df1b92](https://github.com/hajkmap/Hajk/commit/8df1b9253aae06c8b42a37b36100a595e4e7c74b)
- PropertyChecker: Don't allow clicking on points that'd result in response from multiple properties. User is informed when such a click occurs and told to click further away from the property border.
- Bookmark: Fixed removal issue. [0f1172f](https://github.com/hajkmap/Hajk/commit/0f1172f108d57575dbe8e8ecabb20aa8b8a15c4e)
- Print: Print tool does not print WMS layers that requires credentials[#1442](https://github.com/hajkmap/Hajk/issues/1442)

## [3.13.21] - 2023-11-17

### Fixed

- The tools list in Admin is now refreshed: only current tools are available, sorting is alphabetical.

## [3.13.20] - 2023-11-14

### Added

- Support for the EPSG:5847 in Admin UI. Keep in mind that you still need to add appropriate projection definitions to each map config.
- It is now possible to disable unused tabs in LayerSwitcher, e.g. only show the Background layers tab. [#1431](https://github.com/hajkmap/Hajk/issues/1431)

### Fixed

- Upgraded deps, among those `react-markdown`, which required some work. See [#1425](https://github.com/hajkmap/Hajk/issues/1425).

## [3.13.19] - 2023-10-29

### Added

- Client: LayerSwitcher now indicates which groups have enabled layers by styling those groups with a bold font. [#1257](https://github.com/hajkmap/Hajk/issues/1257)

## [3.13.18] - 2023-10-27

### Added

- Client/Admin: it's now possible to configure the Search tool so that it starts with the search field in focus. [#1424](https://github.com/hajkmap/Hajk/issues/1424)

### Fixed

- Client: avoid long floating values for the `z` parameter in URL hash. [#1422](https://github.com/hajkmap/Hajk/issues/1422)

## [3.13.17] - 2023-10-25

### Security

- Backend: Tightened security: if AD_LOOKUP_ACTIVE is 'false' but RESTRICT_ADMIN_ACCESS_TO_AD_GROUPS has a value, access to admin-only endpoints will be restricted (to everyone).

## [3.13.16] - 2023-10-25

### Added

- Backend: More logging options in `.env`. Also, we now save 14 old log files by default (was 1 before). [#1421](https://github.com/hajkmap/Hajk/issues/1421)

### Fixed

- Client: Drawer Toggle Button could sometimes disappear in certain map configurations. Fixed in #1414. [#1414](https://github.com/hajkmap/Hajk/issues/1414)

## [3.13.15] - 2023-10-24

### Added

- New plugin: **this release marks the first Public Beta of _PropertyChecker_.** See [#1360](https://github.com/hajkmap/Hajk/issues/1360). There's also a README included in the plugin's directory, make sure to read it in order to successfully setup this plugin.
- Backend: added `/fir` endpoints. This functionality requires the _myCarta FR Direkt_ service. [#1416](https://github.com/hajkmap/Hajk/issues/1416)

## [3.13.14] - 2023-10-06

### Fixed

- The `/ad/findCommonADGroupsForUsers` endpoint works again. [#1415](https://github.com/hajkmap/Hajk/issues/1415)

## [3.13.13] - 2023-10-05

### Added

- Admins can configure a link for each layer. The link will be visible in LayerSwitcher's metadata part. [#1387](https://github.com/hajkmap/Hajk/issues/1387)

### Fixed

- It's now possible to have other target than `_blank` for links in infoclick. [#1388](https://github.com/hajkmap/Hajk/issues/1388)
- Removed the 360px width limit in MapClickViewer lists. [#1411](https://github.com/hajkmap/Hajk/issues/1411)
- Minor bug in DocumentHandler [#1404](https://github.com/hajkmap/Hajk/issues/1404)

## [3.13.12] - 2023-09-22

### Added

- Added CHANGELOG.md to the project
- Added a confirmation dialog that shows on window close. It informs the user about unsaved changes (in e.g. Measurer or Sketch) that will be lost. [#1403](https://github.com/hajkmap/Hajk/issues/1403)

### Fixed

- Support for relative URLs [#1399](https://github.com/hajkmap/Hajk/issues/1399)

### Security

- Upgraded Client dependencies. The main change here is OpenLayer 8.0.0.
- Upgraded Backend dependencies.

## [3.13.11] - 2023-09-05

### Added

- Client UI: It is now possible for admins to make the side drawer permanent (i.e. not hidable by user). [#1316](https://github.com/hajkmap/Hajk/issues/1316), [#1367](https://github.com/hajkmap/Hajk/issues/1367).

## [3.13.10] - 2023-09-05

### Added

- Measurer plugin: It is now possible to perform perpendicular measurements by using a modifier key (Ctrl or Cmd, depending on the OS) [#1361](https://github.com/hajkmap/Hajk/issues/1361)
- The HTML `target` attribute is now accepted and rendered correctly if specified, [#1389](https://github.com/hajkmap/Hajk/pull/1389)
- Added the possibility to change icon background in feature list, [#1385](https://github.com/hajkmap/Hajk/issues/1385)

### Fixed

- Admin UI: correct attribute is used when configuring Edit, [#1317](https://github.com/hajkmap/Hajk/issues/1317)
- Fix for incorrect font size in LayerSwitcher's metadata link. [Commit](https://github.com/hajkmap/Hajk/commit/92fbf3fed23cf8f6417cce0285fe2ca074eef1d3)
- Fixes to erroneous warning messages about missing plugins in current configuration. See [#1390](https://github.com/hajkmap/Hajk/issues/1390) and [#1391](https://github.com/hajkmap/Hajk/issues/1391).

## [3.13.9] - 2023-08-22

### Fixed

- Bug fix for the Simple Edit Workflow added in 3.13.8

## [3.13.8] - 2023-08-21

### Added

- Edit plugin: the Simple Edit Workflow, as described in [#1377](https://github.com/hajkmap/Hajk/issues/1377)

### Changed

- Swagger UI API Explorer now defaults to the V2 path

## [3.13.7] - 2023-08-18

### Changed

- Layout fixes to the Error page added in 3.13.6
- Made some `appConfig.json` keys optional by not expecting any values for them in `index.js`

## [3.13.6] - 2023-08-17

### Added

- A new error page is displayed if Hajk fails on the initial load. The new page also shows a _Reset_ button, which may fix common loading errors by cleaning up the client's state. [Commit](https://github.com/hajkmap/Hajk/commit/f2201fc2c63988175172315313344a8992a17c4d)

### Changed

- The consolidated loading approach, first added in [#682](https://github.com/hajkmap/Hajk/issues/682) is now the only way of loading Client UI. This fact allows for a lot of cleanups in the start-up code.

### Removed

- BREAKING: Client UI does not support V1 API anymore. The only supported way of loading the application is the new approach, introduced in #682.
- Since the change above, there is no more use for `experimentalNewApi` in `appConfig.json`. It has now been removed.

### Security

- A number of Client's dependencies have been upgraded.

## [3.13.5] - 2023-08-14

### Changed

- Fix to list sorting when toggling layers in a group layer ([#1362](https://github.com/hajkmap/Hajk/issues/1362))
- Added missing dependencies in Client's [package.json](https://github.com/hajkmap/Hajk/commit/eadc703d9d90b9a3f793b6be422544251ec9a3f6)
- Imports are now made using relative paths. [Commit](https://github.com/hajkmap/Hajk/commit/413d40a081bfe1b1f9f3d436f07b918219375aa5)

### Removed

- Removed all references to the unused `shortcodes` feature in `FeatureInfo`. Also, removed unused dependencies from Client's package.json. [Commit](https://github.com/hajkmap/Hajk/commit/436afad8d9dd37caec8cb4fe9dabeb4c03b67ff7)
- Legacy plugins removed in this release are:
  - `Draw` (use `Sketch` instead)
  - `Measure` (use `Measurer` instead)
- Also `VTSearch` was removed as it is to be transformed into a _community plugin_ (i.e. not included in the main build)

## [3.13.4] - 2023-08-14

### Fixed

- Restored the missing `.material-icons` class in our CSS. This disappeared in a recent MUI bump and has now to be added manually for font icons.

## [3.13.3] - 2023-08-11

## [3.12.0-rc.2] - 2023-06-19

[unreleased]: https://github.com/hajkmap/Hajk/compare/v4.0.0...develop
[4.1.0]: https://github.com/hajkmap/Hajk/compare/v4.1.0-rc.1...v4.1.0
[4.1.0-rc.1]: https://github.com/hajkmap/Hajk/compare/v4.0.0...v4.1.0-rc.1
[4.0.0]: https://github.com/hajkmap/Hajk/compare/v4.0.0-rc.2...v4.0.0
[4.0.0-rc.2]: https://github.com/hajkmap/Hajk/compare/v4.0.0-rc.1...v4.0.0-rc.2
[4.0.0-rc.1]: https://github.com/hajkmap/Hajk/compare/v3.14.1...v4.0.0-rc.1
[3.14.1]: https://github.com/hajkmap/Hajk/compare/v3.14.0...v3.14.1
[3.14.0]: https://github.com/hajkmap/Hajk/compare/v3.13.25...v3.14.0
[3.13.25]: https://github.com/hajkmap/Hajk/compare/v3.13.24...v3.13.25
[3.13.24]: https://github.com/hajkmap/Hajk/compare/v3.13.23...v3.13.24
[3.13.23]: https://github.com/hajkmap/Hajk/compare/v3.13.22...v3.13.23
[3.13.22]: https://github.com/hajkmap/Hajk/compare/v3.13.21...v3.13.22
[3.13.21]: https://github.com/hajkmap/Hajk/compare/v3.13.20...v3.13.21
[3.13.20]: https://github.com/hajkmap/Hajk/compare/v3.13.19...v3.13.20
[3.13.19]: https://github.com/hajkmap/Hajk/compare/v3.13.18...v3.13.19
[3.13.18]: https://github.com/hajkmap/Hajk/compare/v3.13.17...v3.13.18
[3.13.17]: https://github.com/hajkmap/Hajk/compare/v3.13.16...v3.13.17
[3.13.16]: https://github.com/hajkmap/Hajk/compare/v3.13.15...v3.13.16
[3.13.15]: https://github.com/hajkmap/Hajk/compare/v3.13.14...v3.13.15
[3.13.14]: https://github.com/hajkmap/Hajk/compare/v3.13.13...v3.13.14
[3.13.13]: https://github.com/hajkmap/Hajk/compare/v3.13.12...v3.13.13
[3.13.12]: https://github.com/hajkmap/Hajk/compare/v3.13.11...v3.13.12
[3.13.11]: https://github.com/hajkmap/Hajk/compare/v3.13.10...v3.13.11
[3.13.10]: https://github.com/hajkmap/Hajk/compare/v3.13.9...v3.13.10
[3.13.9]: https://github.com/hajkmap/Hajk/compare/v3.13.8...v3.13.9
[3.13.8]: https://github.com/hajkmap/Hajk/compare/v3.13.7...v3.13.8
[3.13.7]: https://github.com/hajkmap/Hajk/compare/v3.13.6...v3.13.7
[3.13.6]: https://github.com/hajkmap/Hajk/compare/v3.13.5...v3.13.6
[3.13.5]: https://github.com/hajkmap/Hajk/compare/v3.13.4...v3.13.5
[3.13.4]: https://github.com/hajkmap/Hajk/compare/v3.13.3...v3.13.4
[3.13.3]: https://github.com/hajkmap/Hajk/compare/v3.12.0-rc.2...v3.13.3
[3.12.0-rc.2]: https://github.com/hajkmap/Hajk/releases/tag/v3.12.0-rc.2

---

## Editor's help

Types of changes:

- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Removed` for now removed features.
- `Fixed` for any bug fixes.
- `Security` in case of vulnerabilities.
