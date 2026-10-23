import {
  calculateFeedingIndex,
  getWeatherDescription,
  getWindDirection,
  type WeatherData,
} from './weatherService';

function weather(overrides: Partial<WeatherData> = {}): WeatherData {
  return {
    temperature: 15,
    pressure: 1015,
    windSpeed: 10,
    windDirection: 135,
    weatherCode: 0,
    locationName: 'Helsinki',
    pressureHistory: [
      { time: '2026-10-21T10:00', pressure: 1015 },
      { time: '2026-10-22T10:00', pressure: 1010 },
    ],
    forecast: [],
    sunrise: null,
    sunset: null,
    fetchedAt: '2026-10-22T10:00:00.000Z',
    ...overrides,
  };
}

describe('weather helpers', () => {
  it('translates weather codes to Finnish descriptions', () => {
    expect(getWeatherDescription(0)).toBe('Selkeää');
    expect(getWeatherDescription(63)).toBe('Vesisadetta');
    expect(getWeatherDescription(999)).toBe('Säätilanne ei tiedossa');
  });

  it('converts wind direction to compass points', () => {
    expect(getWindDirection(0)).toBe('P');
    expect(getWindDirection(135)).toBe('SE');
    expect(getWindDirection(360)).toBe('P');
  });

  it('gives a good score for moderate weather and falling pressure', () => {
    const result = calculateFeedingIndex(weather());

    expect(result.score).toBe(90);
    expect(result.label).toBe('Hyvät olosuhteet');
    expect(result.explanation).toContain('laskenut');
    expect(result.factors.map((factor) => factor.label)).toEqual([
      'Lämpötila',
      'Ilmanpaine',
      'Tuuli',
      'Säätila',
    ]);
  });

  it('reduces the score for extreme conditions', () => {
    const result = calculateFeedingIndex(
      weather({
        temperature: -5,
        windSpeed: 35,
        weatherCode: 95,
        pressureHistory: [
          { time: '2026-10-21T10:00', pressure: 1000 },
          { time: '2026-10-22T10:00', pressure: 1012 },
        ],
      })
    );

    expect(result.score).toBe(14);
    expect(result.label).toBe('Haastavat olosuhteet');
  });
});
