import * as FileSystem from 'expo-file-system/legacy';

export type WeatherData = {
  temperature: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  locationName: string;
  pressureHistory: PressurePoint[];
  forecast: ForecastPoint[];
  sunrise: string | null;
  sunset: string | null;
  fetchedAt: string;
};

export type PressurePoint = {
  time: string;
  pressure: number;
};

export type FeedingIndex = {
  score: number;
  label: string;
  explanation: string;
  factors: FeedingFactor[];
};

export type FeedingFactor = {
  label: string;
  points: number;
  explanation: string;
};

export type ForecastPoint = {
  time: string;
  temperature: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
};

type OpenMeteoResponse = {
  current?: {
    time?: string;
    temperature_2m?: number;
    surface_pressure?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    weather_code?: number;
  };
  hourly?: {
    time?: string[];
    surface_pressure?: number[];
    temperature_2m?: number[];
    wind_speed_10m?: number[];
    precipitation?: number[];
    weather_code?: number[];
  };
  daily?: {
    sunrise?: string[];
    sunset?: string[];
  };
};

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

export async function fetchWeather(
  latitude: number,
  longitude: number,
  locationName: string
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current:
      'temperature_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code',
    hourly: 'surface_pressure,temperature_2m,wind_speed_10m,precipitation,weather_code',
    daily: 'sunrise,sunset',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    timezone: 'auto',
    past_days: '1',
    forecast_days: '2',
  });

  const response = await fetch(`${OPEN_METEO_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Säätietojen haku epäonnistui (HTTP ${response.status}).`);
  }

  const data = (await response.json()) as OpenMeteoResponse;
  const current = data.current;

  if (
    current?.temperature_2m === undefined ||
    current.surface_pressure === undefined ||
    current.wind_speed_10m === undefined ||
    current.wind_direction_10m === undefined ||
    current.weather_code === undefined ||
    current.time === undefined
  ) {
    throw new Error('Sääpalvelu palautti puutteelliset tiedot.');
  }

  const hourlyTimes = data.hourly?.time;
  const hourlyPressures = data.hourly?.surface_pressure;
  if (
    hourlyTimes === undefined ||
    hourlyPressures === undefined ||
    hourlyTimes.length !== hourlyPressures.length
  ) {
    throw new Error('Ilmanpaineen tuntihistoriaa ei saatu sääpalvelusta.');
  }

  const hourlyTemperatures = data.hourly?.temperature_2m;
  const hourlyWindSpeeds = data.hourly?.wind_speed_10m;
  const hourlyPrecipitation = data.hourly?.precipitation;
  const hourlyWeatherCodes = data.hourly?.weather_code;
  if (
    hourlyTemperatures === undefined ||
    hourlyWindSpeeds === undefined ||
    hourlyPrecipitation === undefined ||
    hourlyWeatherCodes === undefined ||
    hourlyTemperatures.length !== hourlyTimes.length ||
    hourlyWindSpeeds.length !== hourlyTimes.length ||
    hourlyPrecipitation.length !== hourlyTimes.length ||
    hourlyWeatherCodes.length !== hourlyTimes.length
  ) {
    throw new Error('Sääennusteen tuntitietoja ei saatu sääpalvelusta.');
  }

  const pressureHistory = hourlyTimes
    .map((time, index) => ({ time, pressure: hourlyPressures[index] }))
    .filter(
      (point): point is PressurePoint =>
        point.pressure !== undefined && point.time <= current.time!
    )
    .slice(-24);

  if (pressureHistory.length < 2) {
    throw new Error('Ilmanpaineen tuntihistoriassa ei ole tarpeeksi tietoja.');
  }

  const forecast = hourlyTimes
    .map((time, index) => ({
      time,
      temperature: hourlyTemperatures[index],
      windSpeed: hourlyWindSpeeds[index],
      precipitation: hourlyPrecipitation[index],
      weatherCode: hourlyWeatherCodes[index],
    }))
    .filter((point) => point.time >= current.time!)
    .slice(0, 48);

  return {
    temperature: current.temperature_2m,
    pressure: current.surface_pressure,
    windSpeed: current.wind_speed_10m,
    windDirection: current.wind_direction_10m,
    weatherCode: current.weather_code,
    locationName,
    pressureHistory,
    forecast,
    sunrise: data.daily?.sunrise?.[0] ?? null,
    sunset: data.daily?.sunset?.[0] ?? null,
    fetchedAt: new Date().toISOString(),
  };
}

const WEATHER_CACHE_URI = `${FileSystem.documentDirectory ?? ''}weather-cache.json`;

export async function fetchWeatherWithCache(
  latitude: number,
  longitude: number,
  locationName: string
): Promise<{ weather: WeatherData; isCached: boolean }> {
  try {
    const weather = await fetchWeather(latitude, longitude, locationName);
    if (FileSystem.documentDirectory) {
      await FileSystem.writeAsStringAsync(WEATHER_CACHE_URI, JSON.stringify(weather));
    }
    return { weather, isCached: false };
  } catch (error) {
    if (!FileSystem.documentDirectory) {
      throw error;
    }
    const cacheInfo = await FileSystem.getInfoAsync(WEATHER_CACHE_URI);
    if (!cacheInfo.exists) {
      throw error;
    }
    const cached = JSON.parse(await FileSystem.readAsStringAsync(WEATHER_CACHE_URI)) as WeatherData;
    return { weather: cached, isCached: true };
  }
}

export function getWeatherDescription(weatherCode: number): string {
  if (weatherCode === 0) return 'Selkeää';
  if ([1, 2, 3].includes(weatherCode)) return 'Pilvistä';
  if ([45, 48].includes(weatherCode)) return 'Sumua';
  if ([51, 53, 55, 56, 57].includes(weatherCode)) return 'Tihkusadetta';
  if ([61, 63, 65, 66, 67].includes(weatherCode)) return 'Vesisadetta';
  if ([71, 73, 75, 77].includes(weatherCode)) return 'Lumipyryä';
  if ([80, 81, 82].includes(weatherCode)) return 'Sadekuuroja';
  if ([85, 86].includes(weatherCode)) return 'Lumikuuroja';
  if ([95, 96, 99].includes(weatherCode)) return 'Ukkosta';
  return 'Säätilanne ei tiedossa';
}

export function getWindDirection(direction: number): string {
  const directions = ['P', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(direction / 45) % directions.length;
  return directions[index];
}

export function calculateFeedingIndex(weather: WeatherData): FeedingIndex {
  const pressures = weather.pressureHistory.map((point) => point.pressure);
  const pressureChange = pressures[pressures.length - 1] - pressures[0];
  const factors: FeedingFactor[] = [];
  let score = 50;

  if (weather.temperature >= 8 && weather.temperature <= 22) {
    score += 12;
    factors.push({ label: 'Lämpötila', points: 12, explanation: 'Lämpötila on kalastukseen sopivalla alueella.' });
  } else if (weather.temperature < 0 || weather.temperature > 28) {
    score -= 10;
    factors.push({ label: 'Lämpötila', points: -10, explanation: 'Lämpötila on haastava.' });
  } else {
    factors.push({ label: 'Lämpötila', points: 0, explanation: 'Lämpötila on kohtuullinen.' });
  }

  if (Math.abs(pressureChange) <= 2) {
    score += 8;
    factors.push({ label: 'Ilmanpaine', points: 8, explanation: 'Paine on melko vakaa.' });
  } else if (pressureChange < -2 && pressureChange >= -8) {
    score += 15;
    factors.push({ label: 'Ilmanpaine', points: 15, explanation: 'Laskeva paine voi aktivoida kalaa.' });
  } else if (pressureChange > 6 || pressureChange < -10) {
    score -= 8;
    factors.push({ label: 'Ilmanpaine', points: -8, explanation: 'Paineen muutos on haastava.' });
  } else {
    factors.push({ label: 'Ilmanpaine', points: 0, explanation: 'Paineen muutos on maltillinen.' });
  }

  if (weather.windSpeed >= 5 && weather.windSpeed <= 20) {
    score += 8;
    factors.push({ label: 'Tuuli', points: 8, explanation: 'Tuulen nopeus on sopiva.' });
  } else if (weather.windSpeed > 30) {
    score -= 12;
    factors.push({ label: 'Tuuli', points: -12, explanation: 'Tuuli on voimakas.' });
  } else {
    factors.push({ label: 'Tuuli', points: 0, explanation: 'Tuuli on heikko.' });
  }

  if ([0, 1, 2, 3, 51, 53, 61, 63, 80, 81].includes(weather.weatherCode)) {
    score += 5;
    factors.push({ label: 'Säätila', points: 5, explanation: 'Säätila voi olla kalastukseen suotuisa.' });
  } else if ([71, 73, 75, 95, 96, 99].includes(weather.weatherCode)) {
    score -= 6;
    factors.push({ label: 'Säätila', points: -6, explanation: 'Säätila on haastava.' });
  } else {
    factors.push({ label: 'Säätila', points: 0, explanation: 'Säätila on neutraali.' });
  }

  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const label =
    boundedScore >= 70 ? 'Hyvät olosuhteet' : boundedScore >= 45 ? 'Kohtalaiset olosuhteet' : 'Haastavat olosuhteet';
  const explanation =
    pressureChange < -2
      ? 'Paine on laskenut, mikä voi aktivoida kalaa.'
      : Math.abs(pressureChange) <= 2
        ? 'Paine on pysynyt melko vakaana.'
        : 'Paine on noussut, joten kala voi olla varovaisempi.';

  return { score: boundedScore, label, explanation, factors };
}
