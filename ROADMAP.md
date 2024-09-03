# ROADMAP

_Last updated: 2024-09-03_

The following is a high-level overview of the planned development for Hajk and its various components (Backend, Client UI, Admin UI).

## 3.14

The final release to include both .NET and NodeJS backends as official solutions.

Also, this will be the last release in the 3.x branch.

## 4.0

This release marks the removal of the .NET backend, leaving NodeJS as the sole official backend solution. Other than that, no major changes are expected; for example, the backend will continue to use a file-based JSON structure for configuration.

## 4.x

Includes major fixes to the Client UI, such as revamped window management.

## 5.0

The Hajk 5 branch introduces several additions and changes:
- A completely rewritten Admin UI (development begins in fall 2024).
- The backend will no longer support the legacy file-based JSON store. Instead, all configuration will be stored in a relational database (most likely PostgreSQL, though other solutions may be supported in the future).
