import Papa from 'papaparse';
import type { CruiseObservation } from '../db/database';
import { SyncStatus } from '../db/database';

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  observations: Partial<CruiseObservation>[];
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
    ice_observations: [],
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
