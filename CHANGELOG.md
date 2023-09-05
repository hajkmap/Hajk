# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Upcoming features will be added here prior a release is made

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

[unreleased]: https://github.com/hajkmap/Hajk/compare/v3.13.11...hstd-main
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
