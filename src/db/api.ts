import { db, type Cruise, type CruiseObservation, SyncStatus } from './database';

// Generate UUID (simple version, can be replaced with uuid library)
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Cruise API
export const cruiseAPI = {
  async getAll(): Promise<Cruise[]> {
    return db.cruises
      .where('syncStatus')
      .notEqual(SyncStatus.FLAG_FOR_DELETION)
      .and(cruise => cruise.syncStatus !== SyncStatus.STALE)
      .toArray();
  },

  async getById(uuid: string): Promise<Cruise | undefined> {
    return db.cruises.get(uuid);
  },

  async create(cruise: Omit<Cruise, 'uuid'>): Promise<Cruise> {
    const newCruise: Cruise = {
      ...cruise,
      uuid: generateUUID(),
    };
    await db.cruises.add(newCruise);
    return newCruise;
  },

  async update(uuid: string, updates: Partial<Cruise>): Promise<void> {
    await db.cruises.update(uuid, {
      ...updates,
      localChanges: (updates.localChanges || 0) + 1,
    });
  },

  async delete(uuid: string): Promise<void> {
    // Delete all related observations first
    await observationAPI.deleteByCruise(uuid);
    await db.cruises.delete(uuid);
  },

  async flagForDeletion(uuid: string): Promise<void> {
    await db.cruises.update(uuid, {
      syncStatus: SyncStatus.FLAG_FOR_DELETION,
    });
  },
};

// Observation API
export const observationAPI = {
  async getAll(): Promise<CruiseObservation[]> {
    return db.observations.toArray();
  },

  async getById(uuid: string): Promise<CruiseObservation | undefined> {
    return db.observations.get(uuid);
  },

  async getByCruise(cruiseUuid: string): Promise<CruiseObservation[]> {
    return db.observations
      .where('cruise')
      .equals(cruiseUuid)
      .sortBy('entry_datetime');
  },

  async create(observation: Omit<CruiseObservation, 'uuid'>): Promise<CruiseObservation> {
    const newObservation: CruiseObservation = {
      ...observation,
      uuid: generateUUID(),
    };
    await db.observations.add(newObservation);
    return newObservation;
  },

  async update(uuid: string, updates: Partial<CruiseObservation>): Promise<void> {
    await db.observations.update(uuid, {
      ...updates,
      localChanges: (updates.localChanges || 0) + 1,
    });
  },

  async delete(uuid: string): Promise<void> {
    await db.observations.delete(uuid);
  },

  async deleteByCruise(cruiseUuid: string): Promise<void> {
    await db.observations
      .where('cruise')
      .equals(cruiseUuid)
      .delete();
  },

  async flagForDeletion(uuid: string): Promise<void> {
    await db.observations.update(uuid, {
      syncStatus: SyncStatus.FLAG_FOR_DELETION,
    });
  },
};

// Utility functions
export const dbUtils = {
  async clearAll(): Promise<void> {
    await db.observations.clear();
    await db.cruises.clear();
  },

  async exportData() {
    const cruises = await cruiseAPI.getAll();
    const observations = await observationAPI.getAll();
    return { cruises, observations };
  },

  async importData(data: { cruises: Cruise[]; observations: CruiseObservation[] }) {
    await db.transaction('rw', [db.cruises, db.observations], async () => {
      await db.cruises.bulkPut(data.cruises);
      await db.observations.bulkPut(data.observations);
    });
  },
};
