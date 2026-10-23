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

const SPOTS_KEY = 'kalastajapro.fishing-spots';
const CATCHES_KEY = 'kalastajapro.catches';

function read<T>(key: string): T[] {
  if (typeof localStorage === 'undefined') return [];
  const value = localStorage.getItem(key);
  return value ? (JSON.parse(value) as T[]) : [];
}

function write<T>(key: string, value: T[]) {
  if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(value));
}

export async function getFishingSpots(): Promise<FishingSpot[]> {
  return read<FishingSpot>(SPOTS_KEY).sort((a, b) => b.id - a.id);
}

export async function addFishingSpot(name: string, latitude: number, longitude: number): Promise<void> {
  const spots = read<FishingSpot>(SPOTS_KEY);
  const id = spots.length ? Math.max(...spots.map((spot) => spot.id)) + 1 : 1;
  write(SPOTS_KEY, [...spots, { id, name, latitude, longitude }]);
}

export async function getCatchRecords(): Promise<CatchRecord[]> {
  return read<CatchRecord>(CATCHES_KEY).sort(
    (a, b) => b.date.localeCompare(a.date) || b.id - a.id
  );
}

export async function addCatchRecord(
  species: string, weight: number, date: string, location: string,
  imageUri: string | null, latitude: number | null, longitude: number | null
): Promise<void> {
  const catches = read<CatchRecord>(CATCHES_KEY);
  const id = catches.length ? Math.max(...catches.map((record) => record.id)) + 1 : 1;
  write(CATCHES_KEY, [...catches, { id, species, weight, date, location, imageUri, latitude, longitude }]);
}

export async function updateCatchRecord(
  id: number, species: string, weight: number, date: string, location: string,
  imageUri: string | null, latitude: number | null, longitude: number | null
): Promise<void> {
  write(
    CATCHES_KEY,
    read<CatchRecord>(CATCHES_KEY).map((record) =>
      record.id === id
        ? { ...record, species, weight, date, location, imageUri, latitude, longitude }
        : record
    )
  );
}

export async function deleteCatchRecord(id: number): Promise<void> {
  write(CATCHES_KEY, read<CatchRecord>(CATCHES_KEY).filter((record) => record.id !== id));
}
