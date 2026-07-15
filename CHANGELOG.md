# Changelog

All notable changes to the VLSM Calculator are documented in this file.

The project follows [Semantic Versioning](https://semver.org/), and this changelog follows the structure recommended by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Unreleased

## 0.5.1 - 2026-07-15

### Added

- First/last usable-address selector for Standard IPv4 gateway placement.
- Gateway-position metadata in saved browser state and spreadsheet summaries.
- Unit coverage for first, last, and provider-managed gateway behavior.

### Changed

- Defaulted Standard IPv4 gateways to the last usable address.
- Moved the CIDR overlap checker and route summarisation tools into a collapsed Network utilities menu.
- Kept AWS VPC and Azure virtual network gateways provider-managed at `network + 1`.
- Updated the application version to `0.5.1`.

### Fixed

- Prevented the gateway from also appearing as the first or last address in the displayed host range.
- Preserved traditional usable-host capacity and exact-fit subnet sizing while separating the gateway from the displayed host range.

## 0.5.0 - 2026-07-15

### Added

- Optional VLAN IDs for subnet requirements, validated as unique values from 1 through 4094.
- Selectable VLAN ID and Gateway result columns.
- Gateway data in clipboard, CSV, and native XLSX exports.
- Exact IPv4 route summarisation for `/0` through `/32` CIDRs.
- Route aggregation support for sibling, recursive, duplicate, contained, host, and disjoint routes without broadening address coverage.
- Browser persistence for VLAN and route-summarisation inputs.

## 0.4.0 - 2026-07-15

### Added

- AWS VPC reserved-address mode with `/16` through `/28` prefix enforcement.
- Azure virtual network reserved-address mode with `/2` through `/29` prefix enforcement.
- Provider-aware host-range, reserved-address, and capacity calculations.
- Standalone CIDR overlap detection with equality, containment, adjacency, `/31`, and `/32` support.
- Defensive overlap detection for generated allocation plans.
- Addressing-mode metadata in XLSX summary worksheets.

### Changed

- Added responsive addressing-mode controls and provider-specific guidance.
- Expanded unit coverage for cloud allocation policies and CIDR relationships.

## 0.3.0 - 2026-07-14

### Added

- Rebuilt static application under `public/` using browser-native ES modules.
- Pure IPv4, CIDR, validation, and largest-first VLSM allocation modules.
- Allocation summary and address-space utilisation indicator.
- Selectable output columns, clipboard copying, CSV export, and native two-worksheet XLSX export.
- Browser storage with a 90-day expiry and a confirmed full-page reset.
- Calculator favicon and GitHub Pages deployment assets.
- Node unit tests, coverage thresholds, ESLint, static-site validation, dependency auditing, CI, and GitHub Pages deployment workflows.
- Architecture and local-processing privacy documentation.

### Changed

- Moved unused pre-refactor files into `_legacy/`.
- Standardised development tooling on Node.js 24 and lock-file-based installs.

### Security

- Added a restrictive browser Content Security Policy.
- Neutralised spreadsheet-formula injection in exported user-controlled values.
- Kept all calculations, saved plans, and exports local to the browser.

## Earlier history - 2021-03-28 to 2025-10-14

- Created the original browser-based VLSM table generator.
- Added subnet requirement rows, IPv4 helpers, validation, selectable table columns, and basic styling.
- Corrected allocation order so the largest subnet is placed first.
- Added the custom-domain configuration and subsequent naming updates.
