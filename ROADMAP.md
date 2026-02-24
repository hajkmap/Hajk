# ROADMAP

_Last updated: 2026-02-03_

The following is a high-level overview of the planned development for Hajk and its various components (Backend, Client UI, Admin UI).

## 3.14

_Update: 3.14 has been released on Sep 16th 2024. See [release notes](https://github.com/hajkmap/Hajk/releases/tag/v3.14.0)._

The final release to include both .NET and NodeJS backends as official solutions.

Also, this will be the last release in the 3.x branch.

## 4.0

_Update: 4.0 has been release on Apr 4th 2025. See [release notes](https://github.com/hajkmap/Hajk/releases/tag/v4.0.0)._

This release marks the removal of the .NET backend, leaving NodeJS as the sole official backend solution.

In addition, Client UI sees significant updates to the Layer Switcher tool as well as the application's window management.

## 4.1

_Update: 4.1 has been release on Jun 18th 2025. See [release notes](https://github.com/hajkmap/Hajk/releases/tag/v4.1.0)._

This is primarily a fix release that addresses some of the issues related to the rewrite of LayerSwitcher as seen in 4.0.

## 4.2

_Update: 4.2 has been release on Jan 23rd 2026. See [release notes](https://github.com/hajkmap/Hajk/releases/tag/v4.2.0)._

This release includes a major upgrade of our UI library, MUI, to version 7.

Also, an overhaul of the Introduction Guide and the Anchor tool is included in this release.

## 4.3

Client is migrated to Vite, leaving the CRA behind.

## 4.4

Two of the most important findings from CodeQL are fixed in Backend:

- Uncontrolled data used in path expression (https://github.com/hajkmap/Hajk/security/code-scanning/53)
- Missing rate limiting (https://github.com/hajkmap/Hajk/security/code-scanning/8)

## 5.0

The Hajk 5 branch introduces several additions and changes:

- A completely rewritten Admin UI (development begins in fall 2024).
- The backend will no longer support the legacy file-based JSON store. Instead, all configuration will be stored in a relational database (most likely PostgreSQL, though other solutions may be supported in the future).
