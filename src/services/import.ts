import Papa from 'papaparse';
import type { CruiseObservation, IceObservation } from '../db/database';
import { SyncStatus } from '../db/database';

export interface AspectCruiseMeta {
  name?: string;
  voyage_leader?: string;
  captain_name?: string;
  voyage_vessel?: string;
  start_date?: string;
  end_date?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  observations: Partial<CruiseObservation>[];
  cruiseMeta?: AspectCruiseMeta;
}

export interface CsvRow {
  'Date/Time'?: string;
  'Latitude'?: string;
  'Longitude'?: string;
  'Ice Concentration (%)'?: string;
  'Open Water Type'?: string;
  'Air Temp (°C)'?: string;
  'Water Temp (°C)'?: string;
  'Wind Speed (m/s)'?: string;
  'Wind Direction (°)'?: string;
  'Cloud Cover (oktas)'?: string;
  'Visibility'?: string;
  'Weather'?: string;
  'Observer'?: string;
  'Comments'?: string;
  [key: string]: string | undefined;
}

/**
 * Parse CSV file and validate observations
 */
export function parseObservationsCsv(csvContent: string): ImportResult {
  const result: ImportResult = {
    success: false,
    imported: 0,
    errors: [],
    observations: [],
  };

  try {
    const parsed = Papa.parse<CsvRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parsed.errors.length > 0) {
      result.errors = parsed.errors.map((err) => `Row ${err.row}: ${err.message}`);
    }

    // Process each row
    parsed.data.forEach((row, index) => {
      try {
        const obs = parseObservationRow(row);
        result.observations.push(obs);
      } catch (error) {
        result.errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Invalid data'}`);
      }
    });

    result.success = result.errors.length === 0;
    result.imported = result.observations.length;
  } catch (error) {
    result.errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Parse a single CSV row into an observation object
 */
function parseObservationRow(row: CsvRow): Partial<CruiseObservation> {
  // Required fields
  const dateTime = row['Date/Time']?.trim();
  const latitude = row['Latitude']?.trim();
  const longitude = row['Longitude']?.trim();

  if (!dateTime) {
    throw new Error('Date/Time is required');
  }
  if (!latitude) {
    throw new Error('Latitude is required');
  }
  if (!longitude) {
    throw new Error('Longitude is required');
  }

  // Parse and validate date
  const entryDate = new Date(dateTime);
  if (isNaN(entryDate.getTime())) {
    throw new Error(`Invalid date format: ${dateTime}`);
  }

  // Parse and validate latitude
  const lat = parseFloat(latitude);
  if (isNaN(lat) || lat < -90 || lat > 90) {
    throw new Error(`Invalid latitude: ${latitude} (must be between -90 and 90)`);
  }

  // Parse and validate longitude
  const lon = parseFloat(longitude);
  if (isNaN(lon) || lon < -180 || lon > 180) {
    throw new Error(`Invalid longitude: ${longitude} (must be between -180 and 180)`);
  }

  // Build observation object
  const observation: Partial<CruiseObservation> = {
    entry_datetime: entryDate,
    latitude: lat,
    longitude: lon,
    syncStatus: SyncStatus.LOCAL,
    localChanges: 1,
  };

  // Optional numeric fields
  const iceConc = row['Ice Concentration (%)']?.trim();
  if (iceConc) {
    const iceConcValue = parseFloat(iceConc);
    if (!isNaN(iceConcValue) && iceConcValue >= 0 && iceConcValue <= 100) {
      observation.total_ice_concentration = iceConcValue;
    }
  }

  const airTemp = row['Air Temp (°C)']?.trim();
  if (airTemp) {
    const airTempValue = parseFloat(airTemp);
    if (!isNaN(airTempValue)) {
      observation.air_temp = airTempValue;
    }
  }

  const waterTemp = row['Water Temp (°C)']?.trim();
  if (waterTemp) {
    const waterTempValue = parseFloat(waterTemp);
    if (!isNaN(waterTempValue)) {
      observation.water_temp = waterTempValue;
    }
  }

  const windSpeed = row['Wind Speed (m/s)']?.trim();
  if (windSpeed) {
    const windSpeedValue = parseFloat(windSpeed);
    if (!isNaN(windSpeedValue) && windSpeedValue >= 0) {
      observation.wind_speed = windSpeedValue;
    }
  }

  const windDir = row['Wind Direction (°)']?.trim();
  if (windDir) {
    const windDirValue = parseFloat(windDir);
    if (!isNaN(windDirValue) && windDirValue >= 0 && windDirValue <= 360) {
      observation.wind_direction = windDirValue;
    }
  }

  const cloudCover = row['Cloud Cover (oktas)']?.trim();
  if (cloudCover) {
    const cloudCoverValue = parseFloat(cloudCover);
    if (!isNaN(cloudCoverValue) && cloudCoverValue >= 0 && cloudCoverValue <= 8) {
      observation.cloud_cover = cloudCoverValue;
    }
  }

  // Optional text fields
  if (row['Open Water Type']?.trim()) {
    observation.open_water_type = row['Open Water Type'].trim();
  }

  if (row['Visibility']?.trim()) {
    observation.visibility = row['Visibility'].trim();
  }

  if (row['Weather']?.trim()) {
    observation.weather = row['Weather'].trim();
  }

  if (row['Observer']?.trim()) {
    observation.observer = row['Observer'].trim();
  }

  if (row['Comments']?.trim()) {
    observation.comments = row['Comments'].trim();
  }

  return observation;
}

/**
 * Generate a sample CSV template
 */
export function generateSampleCsv(): string {
  const headers = [
    'Date/Time',
    'Latitude',
    'Longitude',
    'Ice Concentration (%)',
    'Open Water Type',
    'Air Temp (°C)',
    'Water Temp (°C)',
    'Wind Speed (m/s)',
    'Wind Direction (°)',
    'Cloud Cover (oktas)',
    'Visibility',
    'Weather',
    'Observer',
    'Comments'
  ];

  const sampleRows = [
    [
      '2025-12-18 10:00:00',
      '-65.5000',
      '-64.2500',
      '75',
      'Brash Ice',
      '-2.5',
      '-1.8',
      '12.5',
      '180',
      '4',
      'Good',
      'Overcast with light snow',
      'John Smith',
      'Heavy pack ice observed'
    ],
    [
      '2025-12-18 14:00:00',
      '-65.7500',
      '-64.5000',
      '90',
      '',
      '-3.0',
      '-1.9',
      '15.0',
      '200',
      '6',
      'Moderate',
      'Snow showers',
      'Jane Doe',
      'Ice thickness approximately 1-2m'
    ]
  ];

  const csvContent = [
    headers.join(','),
    ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Detect whether a file is CSV or ASPeCt text format.
 * ASPeCt files follow the naming convention YYYYMMDDVVNNN (e.g. 20260101SD056)
 * or contain the ---OBSERVATIONS--- marker.
 */
export function detectFileFormat(filename: string, content: string): 'csv' | 'aspect' {
  if (/^\d{8}[A-Za-z]{2}\d+$/.test(filename)) {
    return 'aspect';
  }
  if (filename.toLowerCase().endsWith('.csv')) {
    return 'csv';
  }
  if (content.includes('---OBSERVATIONS---')) {
    return 'aspect';
  }
  return 'csv';
}

/**
 * Parse an ASPeCt text file.
 * Format:
 *   Line 1: JSON object with cruise metadata
 *   Line 2: ---OBSERVATIONS---
 *   Line 3: semicolon-delimited header row
 *   Lines 4+: semicolon-delimited data rows (empty fields = missing value)
 */
export function parseAspectTextFile(content: string): ImportResult {
  const result: ImportResult = {
    success: false,
    imported: 0,
    errors: [],
    observations: [],
  };

  const lines = content.split('\n');
  let headerFields: string[] = [];
  let inObservations = false;
  let headerParsed = false;

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Line 0: JSON cruise metadata
    if (lineIndex === 0 && trimmed.startsWith('{')) {
      try {
        result.cruiseMeta = JSON.parse(trimmed) as AspectCruiseMeta;
      } catch {
        result.errors.push('Line 1: Failed to parse cruise metadata JSON');
      }
      return;
    }

    if (trimmed === '---OBSERVATIONS---') {
      inObservations = true;
      return;
    }

    if (!inObservations) return;

    // First line after the marker is the header row
    if (!headerParsed) {
      headerFields = trimmed.split(';');
      headerParsed = true;
      return;
    }

    try {
      const obs = parseAspectRow(trimmed, headerFields);
      result.observations.push(obs);
    } catch (error) {
      result.errors.push(
        `Line ${lineIndex + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`
      );
    }
  });

  result.success = result.errors.length === 0;
  result.imported = result.observations.length;
  return result;
}

function parseAspectRow(line: string, headers: string[]): Partial<CruiseObservation> {
  const values = line.split(';');

  const get = (field: string): string => {
    const idx = headers.indexOf(field);
    return idx >= 0 ? (values[idx] ?? '').trim() : '';
  };

  const getNum = (field: string): number | null => {
    const v = get(field);
    if (!v) return null;
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };

  const dateStr = get('date');
  const timeStr = get('time');
  if (!dateStr) throw new Error('date is required');

  const entryDate = new Date(`${dateStr}T${timeStr || '00:00:00'}Z`);
  if (isNaN(entryDate.getTime())) {
    throw new Error(`Invalid date/time: ${dateStr} ${timeStr}`);
  }

  const lat = getNum('latitude');
  if (lat === null || lat < -90 || lat > 90) {
    throw new Error(`Invalid latitude: ${get('latitude')}`);
  }

  const lon = getNum('longitude');
  if (lon === null || lon < -180 || lon > 180) {
    throw new Error(`Invalid longitude: ${get('longitude')}`);
  }

  const observation: Partial<CruiseObservation> = {
    entry_datetime: entryDate,
    latitude: lat,
    longitude: lon,
    syncStatus: SyncStatus.LOCAL,
    localChanges: 1,
  };

  const ct = getNum('total_ice_concentration');
  if (ct !== null) observation.total_ice_concentration = ct;

  const owt = get('open_water_type');
  if (owt) observation.open_water_type = owt;

  // Build an IceObservation from ice_observations.N.* fields
  const buildIceObs = (n: number): IceObservation | undefined => {
    const p = `ice_observations.${n}.`;
    const conc = getNum(`${p}ice_concentration`);
    const type = get(`${p}ice_type`);
    if (conc === null && !type) return undefined;
    const ice: IceObservation = {
      ice_concentration: conc ?? 0,
      ice_type: type,
      ice_thickness: get(`${p}ice_thickness`),
      floe_size: get(`${p}floe_size`),
      topography: get(`${p}topography`),
    };
    const snowType = get(`${p}snow_type`);
    if (snowType) ice.snow_type = snowType;
    const snowThick = get(`${p}snow_thickness`);
    if (snowThick) ice.snow_thickness = snowThick;
    const brownIce = get(`${p}brown_ice`);
    if (brownIce) ice.brown_ice = brownIce;
    const mpCov = getNum(`${p}melt_pond_areal_coverage`);
    if (mpCov !== null) ice.melt_pond_coverage = mpCov;
    const mpDepth = getNum(`${p}melt_pond_depth`);
    if (mpDepth !== null) ice.melt_pond_depth = mpDepth;
    const mpL1 = getNum(`${p}melt_pond_length_1`);
    if (mpL1 !== null) ice.melt_pond_length_1 = mpL1;
    const mpL2 = getNum(`${p}melt_pond_length_2`);
    if (mpL2 !== null) ice.melt_pond_length_2 = mpL2;
    return ice;
  };

  const primary = buildIceObs(1);
  if (primary) observation.primary_ice = primary;
  const secondary = buildIceObs(2);
  if (secondary) observation.secondary_ice = secondary;
  const tertiary = buildIceObs(3);
  if (tertiary) observation.tertiary_ice = tertiary;

  const wt = getNum('water_temp');
  if (wt !== null) observation.water_temp = wt;
  const at = getNum('air_temp');
  if (at !== null) observation.air_temp = at;
  const ws = getNum('wind_speed');
  if (ws !== null && ws >= 0) observation.wind_speed = ws;
  const wd = getNum('wind_direction');
  if (wd !== null && wd >= 0 && wd <= 360) observation.wind_direction = wd;
  const cloud = getNum('cloud_cover');
  if (cloud !== null && cloud >= 0 && cloud <= 8) observation.cloud_cover = cloud;

  const vis = get('visibility');
  if (vis) observation.visibility = vis;
  const wx = get('weather');
  if (wx) observation.weather = wx;
  const obs = get('observer');
  if (obs) observation.observer = obs;
  const cmt = get('comments');
  if (cmt) observation.comments = cmt;

  return observation;
}
