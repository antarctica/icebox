# TwIceBox

_So good they built it twice!_

TwIceBox is a complete modernization of [IceBox](https://aws.data.aad.gov.au/aspect/), the Antarctic Sea Ice Processes and Climate (ASPeCt) observation software for collecting and analyzing sea ice data during research cruises.

** This repository must remain private until approval has been granted from AAD to use the reference imagery and documentation, or until such time that these are replaced with our own reference library and docs. **

## Overview

This application enables researchers to:
- Record sea ice observations with coordinates
- Track meteorological data (temperature, wind, cloud cover)
- Document ice conditions and concentrations
- Analyze and filter observation data
- Export data in CSV and ASPECT formats
- Import bulk observations from CSV files

Originally developed by the Australian Antarctic Division, this is a ground-up rewrite using modern web technologies while preserving all original functionality.

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
Comprehensive data entry for each observation:
- **Location**: GPS coordinates (latitude/longitude with validation)
- **Ice Data**: Total ice concentration (0-100%), open water type
- **Weather**: Air temperature, water temperature, wind speed/direction
- **Conditions**: Cloud cover (0-8 oktas), visibility levels
- **Metadata**: Observer name, comments, timestamp

### Export Capabilities
- **CSV Format**: Spreadsheet-compatible export with all fields
- **ASPECT Format**: Scientific standard text format
- Export individual cruises or filtered analysis results
- Automatic filename generation with timestamps

### Import Functionality
- Drag-and-drop CSV upload
- Validation with detailed error reporting
- Preview data before import with summary statistics
- Download sample template with example data
- Bulk import into any cruise

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

Export filtered results to CSV for further analysis.

## Data Storage

All data is stored locally in **IndexedDB** via Dexie.js:
- No server required - works completely offline
- Data persists across browser sessions
- Fast reactive queries for real-time updates
- Full CRUD operations with TypeScript type safety

Database schema includes:
- **Cruises**: Voyage metadata, dates, personnel
- **Observations**: GPS, ice data, weather conditions, metadata

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

For TwIceBox:

**Author**: British Antarctic Survey
**Developer**: Thomas Zwagerman

This is a complete rewrite of the original application. For the legacy Electron ASPeCt IceBox version:

**Original Application**: ASPeCt IceBox  
**Original Author**: Australian Antarctic Division  
**Original Developer**: James Rakich (Maluco Marinero)  
**Original Repository**: https://bitbucket.org/MalucoMarinero/aspect

## License

See LICENSE file for details.
