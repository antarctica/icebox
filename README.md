# IceBox

[![Version](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com/antarctica/icebox/releases)
[![License](https://img.shields.io/github/license/antarctica/icebox)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)

IceBox 2.0.0 is a modernisation and refactor of [IceBox v1.8.3](https://aws.data.aad.gov.au/aspect/), the Antarctic Sea Ice Processes and Climate (ASPeCt) observation software for collecting and analysing sea ice data during research cruises.

## Overview

This application enables researchers to:
- Record sea ice observations with coordinates
- Track meteorological data (temperature, wind, cloud cover)
- Document ice conditions and concentrations
- Analyse and filter observation data
- Export data in CSV and ASPECT formats
- Import bulk observations from CSV files

Originally developed by the Australian Antarctic Division (AAD), this is a refactoring by the British Antarctic Survey using modern web technologies while preserving all original functionality.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit **http://localhost:5173/** to use the application.

## Development

### Available Scripts

```bash
# Development server with HMR
npm run dev

# Type checking
npm run build

# Linting
npm run lint

# Preview production build
npm run preview
```

### Building for Production

```bash
npm run build
```

Output is in the `dist/` directory, ready for static hosting or Electron packaging.

## Configuration

### TypeScript
- Strict mode enabled for maximum type safety
- Separate configs for app code (`tsconfig.app.json`) and Node tooling (`tsconfig.node.json`)

### ESLint
- Flat config format (ESLint 9+)
- React hooks rules enabled
- TypeScript-aware linting

### Tailwind CSS
- Custom configuration in `tailwind.config.js`
- PostCSS processing with `@tailwindcss/postcss` plugin
- Modern `@import "tailwindcss"` syntax (v4)

### IndexedDB

All data is stored locally in **IndexedDB** via Dexie.js:
- Works offline, no server required
- Data persists across browser sessions
- Full CRUD operations with TypeScript type safety
- Database schema includes **Cruises** and **Observations**


## Credits

For IceBox v2.0.0 onwards:

* **Author**: British Antarctic Survey
* **Developer**: Thomas Zwagerman

This is a refactor of the original IceBox v1.8.4. For all version up to v1.8.4:

* **Original Application**: ASPeCt IceBox  
* **Original Author**: Australian Antarctic Division  
* **Original Developer**: James Rakich (Maluco Marinero)  
* **Original Repository**: https://bitbucket.org/MalucoMarinero/aspect

## License

See LICENSE file for details.
