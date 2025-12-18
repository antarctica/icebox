import Dexie, { type EntityTable } from 'dexie';

// Sync status enum matching the original application
export enum SyncStatus {
  LOCAL = 0,
  DISPATCHED = 1,
  SYNCED = 2,
  FLAG_FOR_DELETION = 3,
  STALE = 4,
}

// Ice observation within a cruise observation
export interface IceObservation {
  ice_type: string;
  ice_concentration: number;
  thickness_type: string;
  floe_size: string;
  topography: string;
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
  rostered_persons?: string[];
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
  ice_observations?: IceObservation[];
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
class TwIceBoxDatabase extends Dexie {
  cruises!: EntityTable<Cruise, 'uuid'>;
  observations!: EntityTable<CruiseObservation, 'uuid'>;

  constructor() {
    super('TwIceBoxDB');
    
    this.version(1).stores({
      cruises: 'uuid, syncStatus, name, start_date, end_date, creator',
      observations: 'uuid, cruise, syncStatus, entry_datetime, latitude, longitude',
    });
  }
}

export const db = new TwIceBoxDatabase();

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
    ice_observations: [],
  };
}

export function makeBlankIceObservation(): IceObservation {
  return {
    ice_type: '',
    ice_concentration: 0,
    thickness_type: '',
    floe_size: '',
    topography: '',
  };
}
