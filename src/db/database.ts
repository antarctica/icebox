import Dexie, { type EntityTable } from 'dexie';

// Sync status enum matching the original application
export const SyncStatus = {
  LOCAL: 0,
  DISPATCHED: 1,
  SYNCED: 2,
  FLAG_FOR_DELETION: 3,
  STALE: 4,
} as const;

export type SyncStatus = typeof SyncStatus[keyof typeof SyncStatus];

// Rostered person for observer assignments
export interface RosteredPerson {
  name: string;
  contact?: string;
  rostered_hours: string[]; // Array of hours (0-23) when this person is on duty
}

// Ice observation within a cruise observation (primary, secondary, or tertiary)
export interface IceObservation {
  ice_concentration: number;  // Concentration in tenths
  ice_type: string;            // Ice type code
  ice_thickness: string;       // Thickness code/range
  floe_size: string;          // Floe size code
  topography: string;         // Topography type and coverage
  snow_type?: string;         // Snow type code
  snow_thickness?: string;    // Snow thickness code
  brown_ice?: string;         // Brown ice indicator
  melt_pond_coverage?: number; // Melt pond areal coverage
  melt_pond_depth?: number;   // Melt pond depth
  melt_pond_length_1?: number; // Melt pond length 1
  melt_pond_length_2?: number; // Melt pond length 2
}

// Main Cruise interface
export interface Cruise {
  uuid: string;
  syncStatus: SyncStatus;
  lastSync?: Date;
  localChanges?: number;
  published: boolean;
  name: string;
  voyage_leader: string;
  voyage_vessel?: string;
  voyage_ice_rating?: string;
  captain_name: string;
  creator?: number;
  start_date: Date;
  end_date: Date;
  rostered_persons?: RosteredPerson[];
  measurement_reference?: string;
}

// Cruise Observation interface
export interface CruiseObservation {
  uuid: string;
  cruise: string; // FK to Cruise.uuid
  syncStatus: SyncStatus;
  lastSync?: Date;
  localChanges?: number;
  creator?: number;
  entry_datetime: Date;
  latitude: number;
  longitude: number;
  total_ice_concentration?: number;
  open_water_type?: string;
  // Ice categories (primary, secondary, tertiary)
  primary_ice?: IceObservation;
  secondary_ice?: IceObservation;
  tertiary_ice?: IceObservation;
  // Meteorological observations
  water_temp?: number;
  air_temp?: number;
  wind_speed?: number;
  wind_direction?: number;
  cloud_cover?: number;
  visibility?: string;
  weather?: string;
  comments?: string;
  observer?: string;
}

// Database class
class IceBoxDatabase extends Dexie {
  cruises!: EntityTable<Cruise, 'uuid'>;
  observations!: EntityTable<CruiseObservation, 'uuid'>;

  constructor() {
    super('IceBoxDB');
    
    this.version(1).stores({
      cruises: 'uuid, syncStatus, name, start_date, end_date, creator',
      observations: 'uuid, cruise, syncStatus, entry_datetime, latitude, longitude',
    });
  }
}

export const db = new IceBoxDatabase();

// Helper functions for creating blank entities
export function makeBlankCruise(): Partial<Cruise> {
  return {
    syncStatus: SyncStatus.LOCAL,
    published: false,
    localChanges: 0,
  };
}

export function makeBlankObservation(cruiseId: string): Partial<CruiseObservation> {
  return {
    cruise: cruiseId,
    syncStatus: SyncStatus.LOCAL,
    localChanges: 0,
    entry_datetime: new Date(),
  };
}

export function makeBlankIceObservation(): IceObservation {
  return {
    ice_concentration: 0,
    ice_type: '',
    ice_thickness: '',
    floe_size: '',
    topography: '',
    snow_type: '',
    snow_thickness: '',
  };
}
