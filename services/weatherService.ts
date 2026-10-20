export type WeatherData = {
  temperature: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  locationName: string;
  pressureHistory: PressurePoint[];
};

export type PressurePoint = {
  time: string;
  pressure: number;
};

export type FeedingIndex = {
  score: number;
  label: string;
  explanation: string;
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
    hourly: 'surface_pressure',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    past_days: '1',
    forecast_days: '1',
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

  return {
    temperature: current.temperature_2m,
    pressure: current.surface_pressure,
    windSpeed: current.wind_speed_10m,
    windDirection: current.wind_direction_10m,
    weatherCode: current.weather_code,
    locationName,
    pressureHistory,
  };
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
  let score = 50;

  if (weather.temperature >= 8 && weather.temperature <= 22) score += 12;
  else if (weather.temperature < 0 || weather.temperature > 28) score -= 10;

  if (Math.abs(pressureChange) <= 2) score += 8;
  else if (pressureChange < -2 && pressureChange >= -8) score += 15;
  else if (pressureChange > 6 || pressureChange < -10) score -= 8;

  if (weather.windSpeed >= 5 && weather.windSpeed <= 20) score += 8;
  else if (weather.windSpeed > 30) score -= 12;

  if ([0, 1, 2, 3, 51, 53, 61, 63, 80, 81].includes(weather.weatherCode)) {
    score += 5;
  }
  if ([71, 73, 75, 95, 96, 99].includes(weather.weatherCode)) score -= 6;

  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const label =
    boundedScore >= 70 ? 'Hyvät olosuhteet' : boundedScore >= 45 ? 'Kohtalaiset olosuhteet' : 'Haastavat olosuhteet';
  const explanation =
    pressureChange < -2
      ? 'Paine on laskenut, mikä voi aktivoida kalaa.'
      : Math.abs(pressureChange) <= 2
        ? 'Paine on pysynyt melko vakaana.'
        : 'Paine on noussut, joten kala voi olla varovaisempi.';

  return { score: boundedScore, label, explanation };
}
