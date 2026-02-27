# IceBox

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

## Features

### Cruise Management
- Create and edit research cruises with vessel details
- Track voyage dates, leaders, and crew
- View observation counts per cruise
- Delete cruises (with cascade to observations)

### Observation Recording
Data entry for each observation:
- **Location**: GPS coordinates (latitude/longitude)
- **Ice Data**: Total ice concentration (tenths, 0-10), open water type, and up to three ice categories (primary, secondary, tertiary) each with:
  - Ice concentration (tenths), ice type code, thickness code/range, floe size
  - Topography type and coverage, snow type and thickness
  - Brown ice indicator, melt pond coverage, depth, and dimensions
- **Weather**: Air temperature, water temperature, wind speed/direction
- **Conditions**: Cloud cover (0-8 oktas), visibility levels
- **Metadata**: Observer name, comments, timestamp

### Import and Export Capabilities
Export individual cruises or filtered analysis results:
- **CSV**
- **ASPECT Format**: Text format based on ASPECT standard
- Import data into any cruise 

### Data Analysis
Filter observations by:
- Cruise selection
- Date range
- Geographic bounds (lat/long bounding box)
- Ice concentration range

View statistics:
- Total observations matching filters
- Average ice concentration
- Average air/water temperature
- Average wind speed
- Date range coverage

## Data Storage

All data is stored locally in **IndexedDB** via Dexie.js:
- Works offline, no server required
- Data persists across browser sessions
- Full CRUD operations with TypeScript type safety
- Database schema includes **Cruises** and **Observations**

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

## Credits

For IceBox 2.0.0:

**Author**: British Antarctic Survey
**Developer**: Thomas Zwagerman

This is a refactor of the original IceBox v1.8.4. For the legacy electron-based version:

**Original Application**: ASPeCt IceBox  
**Original Author**: Australian Antarctic Division  
**Original Developer**: James Rakich (Maluco Marinero)  
**Original Repository**: https://bitbucket.org/MalucoMarinero/aspect

## License

See LICENSE file for details.
