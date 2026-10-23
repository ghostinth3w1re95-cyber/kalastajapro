import * as SQLite from 'expo-sqlite';

export type FishingSpot = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

export type CatchRecord = {
  id: number;
  species: string;
  weight: number;
  date: string;
  location: string;
  imageUri: string | null;
  latitude: number | null;
  longitude: number | null;
};

type FishingSpotRow = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

type CatchRecordRow = {
  id: number;
  species: string;
  weight: number;
  date: string;
  location: string;
  imageUri: string | null;
  latitude: number | null;
  longitude: number | null;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('kalastajapro.db').then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS fishing_spots (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          name TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS catches (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          species TEXT NOT NULL,
          weight REAL NOT NULL,
          date TEXT NOT NULL,
          location TEXT NOT NULL,
          image_uri TEXT
        );
      `);
      const columns = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(catches)'
      );
      if (!columns.some((column) => column.name === 'image_uri')) {
        await db.execAsync('ALTER TABLE catches ADD COLUMN image_uri TEXT');
      }
      if (!columns.some((column) => column.name === 'latitude')) {
        await db.execAsync('ALTER TABLE catches ADD COLUMN latitude REAL');
      }
      if (!columns.some((column) => column.name === 'longitude')) {
        await db.execAsync('ALTER TABLE catches ADD COLUMN longitude REAL');
      }
      return db;
    });
  }

  return databasePromise;
}

export async function getFishingSpots(): Promise<FishingSpot[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<FishingSpotRow>(
    'SELECT id, name, latitude, longitude FROM fishing_spots ORDER BY id DESC'
  );
  return rows;
}

export async function addFishingSpot(
  name: string,
  latitude: number,
  longitude: number
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO fishing_spots (name, latitude, longitude) VALUES (?, ?, ?)',
    name,
    latitude,
    longitude
  );
}

export async function getCatchRecords(): Promise<CatchRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CatchRecordRow>(
    'SELECT id, species, weight, date, location, image_uri AS imageUri, latitude, longitude FROM catches ORDER BY date DESC, id DESC'
  );
  return rows;
}

export async function addCatchRecord(
  species: string,
  weight: number,
  date: string,
  location: string,
  imageUri: string | null,
  latitude: number | null,
  longitude: number | null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO catches (species, weight, date, location, image_uri, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)',
    species,
    weight,
    date,
    location,
    imageUri,
    latitude,
    longitude
  );
}

export async function updateCatchRecord(
  id: number,
  species: string,
  weight: number,
  date: string,
  location: string,
  imageUri: string | null,
  latitude: number | null,
  longitude: number | null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE catches SET species = ?, weight = ?, date = ?, location = ?, image_uri = ?, latitude = ?, longitude = ? WHERE id = ?',
    species,
    weight,
    date,
    location,
    imageUri,
    latitude,
    longitude,
    id
  );
}

export async function deleteCatchRecord(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM catches WHERE id = ?', id);
}
