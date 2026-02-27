# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-02-27

### Added
- Full refactor in React 19, TypeScript 5, and Vite 6
- IndexedDB persistence via Dexie.js
- In-app documentation page
- UI with Tailwind CSS v4

### Changed
- Migrated from original AAD IceBox v1.8.3 codebase to a modern BAS-maintained stack
- Replaced legacy jQuery/Bootstrap UI with React components
- Replaced server-side storage with client-side IndexedDB

### Removed
- Server-side dependencies
- Legacy IE/older browser support

## [1.8.3] - (AAD Release)

Original release by the Australian Antarctic Division. See the [original application](https://aws.data.aad.gov.au/aspect/) for history prior to v2.0.0.

[2.0.0]: https://github.com/antarctica/icebox/releases/tag/v2.0.0
[1.8.3]: https://aws.data.aad.gov.au/aspect/