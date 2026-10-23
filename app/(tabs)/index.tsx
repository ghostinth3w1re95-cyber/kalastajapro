import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import Svg, { Line, Polyline } from 'react-native-svg';

import { Text, View } from '@/components/Themed';
import {
  calculateFeedingIndex,
  fetchWeatherWithCache,
  getWeatherDescription,
  getWindDirection,
  type PressurePoint,
  type WeatherData,
} from '@/services/weatherService';

const HELSINKI = { latitude: 60.1699, longitude: 24.9384, name: 'Helsinki' };
const colors = {
  page: '#071a2a',
  panel: '#102d45',
  panelLight: '#173b56',
  cyan: '#5dd8e6',
  white: '#f5fbff',
  muted: '#9db4c2',
  line: '#2b526c',
};

export default function TabOneScreen() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationNotice, setLocationNotice] = useState('Sää haetaan nykyisestä sijainnistasi.');

  const loadWeather = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      let coordinates = HELSINKI;

      if (permission.status === Location.PermissionStatus.GRANTED) {
        try {
          const currentLocation = await Location.getCurrentPositionAsync({});
          coordinates = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            name: 'Nykyinen sijainti',
          };
          setLocationNotice('Sää perustuu nykyiseen sijaintiisi.');
        } catch {
          setLocationNotice('Sijaintia ei saatu. Sää näytetään Helsingin oletussijainnista.');
        }
      } else {
        setLocationNotice('Sijaintilupaa ei myönnetty. Sää näytetään Helsingin oletussijainnista.');
      }

      const result = await fetchWeatherWithCache(
        coordinates.latitude,
        coordinates.longitude,
        coordinates.name
      );
      setWeather(result.weather);
      setLocationNotice(
        result.isCached
          ? 'Verkkoyhteyttä ei ole. Näytetään viimeisin tallennettu säädata.'
          : `${coordinates.name}: sää päivitetty ${new Date(result.weather.fetchedAt).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })}.`
      );
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Säätietojen haku epäonnistui.';
      setError(`${message} Tarkista verkkoyhteys ja yritä uudelleen.`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // The weather request synchronizes external API data into component state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadWeather();
  }, [loadWeather]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>KALASTAJAPRO</Text>
        <Text style={styles.title}>Sää & olosuhteet</Text>
        <Text style={styles.subtitle}>Tarkista päivän kalastusolosuhteet yhdellä silmäyksellä.</Text>
      </View>
      <View style={styles.locationNotice}>
        <Text style={styles.locationNoticeText}>{locationNotice}</Text>
      </View>
      {isLoading ? (
        <View style={styles.feedback}><ActivityIndicator size="large" /><Text>Haetaan säätietoja...</Text></View>
      ) : error ? (
        <View style={styles.feedback}><Text style={styles.error}>{error}</Text><ActionButton label="Yritä uudelleen" onPress={() => void loadWeather()} /></View>
      ) : weather ? (
        <>
          <View style={styles.weatherCard}>
          <View style={styles.weatherInfo}><Text style={styles.location}>{weather.locationName}</Text><Text style={styles.condition}>{getWeatherDescription(weather.weatherCode)}</Text></View>
            <Text style={styles.temperature}>{weather.temperature.toFixed(1)}°</Text>
          </View>
          <View style={styles.indexCard}>
            <View style={styles.indexHeader}><Text style={styles.cardTitle}>Syönti-indeksi</Text><Text style={styles.indexScore}>{calculateFeedingIndex(weather).score}/100</Text></View>
            <Text style={styles.indexLabel}>{calculateFeedingIndex(weather).label}</Text>
            <View style={styles.progressTrack}><View style={[styles.progress, { width: `${calculateFeedingIndex(weather).score}%` }]} /></View>
            <Text style={styles.cardHint}>{calculateFeedingIndex(weather).explanation} Indeksi on suuntaa-antava, ei saalistakuu.</Text>
            {calculateFeedingIndex(weather).factors.map((factor) => (
              <View key={factor.label} style={styles.factorRow}>
                <Text style={styles.factorLabel}>{factor.label}</Text>
                <Text style={[styles.factorPoints, factor.points < 0 && styles.negativePoints]}>
                  {factor.points > 0 ? '+' : ''}{factor.points}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.metrics}>
            <Metric label="Ilmanpaine" value={`${weather.pressure.toFixed(0)} hPa`} />
            <Metric label="Tuuli" value={`${(weather.windSpeed / 3.6).toFixed(1)} m/s`} />
            <Metric label="Suunta" value={getWindDirection(weather.windDirection)} />
          </View>
          <PressureChart points={weather.pressureHistory} />
          <ForecastCard weather={weather} />
          <ActionButton label="Päivitä säätiedot" onPress={() => void loadWeather()} />
        </>
      ) : null}
    </ScrollView>
  );
}

function ForecastCard({ weather }: { weather: WeatherData }) {
  return (
    <View style={styles.forecastCard}>
      <Text style={styles.cardTitle}>Seuraavat tunnit</Text>
      <Text style={styles.sunText}>
        Aurinko: {formatTime(weather.sunrise)}–{formatTime(weather.sunset)}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
        {weather.forecast.map((point) => (
          <View key={point.time} style={styles.forecastItem}>
            <Text style={styles.forecastTime}>{formatTime(point.time)}</Text>
            <Text style={styles.forecastTemperature}>{point.temperature.toFixed(0)}°</Text>
            <Text style={styles.forecastRain}>{point.precipitation.toFixed(1)} mm</Text>
            <Text style={styles.forecastWind}>{(point.windSpeed / 3.6).toFixed(1)} m/s</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function formatTime(value: string | null) {
  return value ? value.slice(11, 16) : '-';
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable style={styles.button} onPress={onPress}><Text style={styles.buttonText}>{label}</Text></Pressable>;
}

function PressureChart({ points }: { points: PressurePoint[] }) {
  const width = 320; const height = 150; const padding = 16;
  const values = points.map((point) => point.pressure);
  const min = Math.min(...values); const range = Math.max(Math.max(...values) - min, 1);
  const chartPoints = points.map((point, index) => {
    const x = padding + (index / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((point.pressure - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  const change = values[values.length - 1] - values[0];
  return <View style={styles.chart}><Text style={styles.cardTitle}>Ilmanpaineen kehitys</Text><Text style={styles.chartTrend}>{change >= 0 ? '+' : ''}{change.toFixed(1)} hPa / 24 h</Text><Svg height={height} viewBox={`0 0 ${width} ${height}`} width="100%"><Line stroke={colors.line} strokeWidth="1" x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} /><Polyline fill="none" points={chartPoints} stroke={colors.cyan} strokeWidth="3" /></Svg><View style={styles.chartLabels}><Text style={styles.chartLabel}>{points[0].time.slice(11, 16)}</Text><Text style={styles.chartLabel}>{points[points.length - 1].time.slice(11, 16)}</Text></View></View>;
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.page, flexGrow: 1, padding: 16, paddingBottom: 34 },
  hero: { backgroundColor: colors.panel, borderRadius: 24, padding: 20 },
  eyebrow: { color: colors.cyan, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  title: { color: colors.white, fontSize: 28, fontWeight: '800', marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6 },
  weatherCard: { alignItems: 'center', backgroundColor: colors.panelLight, borderRadius: 18, flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, padding: 20 },
  weatherInfo: { backgroundColor: 'transparent' },
  location: { color: colors.white, fontSize: 21, fontWeight: '800' },
  locationNotice: { backgroundColor: 'transparent', paddingHorizontal: 4, paddingTop: 10 },
  locationNoticeText: { color: colors.muted, fontSize: 12 },
  condition: { color: colors.muted, fontSize: 15, marginTop: 5 },
  temperature: { color: colors.cyan, fontSize: 42, fontWeight: '800' },
  indexCard: { backgroundColor: colors.panel, borderRadius: 18, marginTop: 12, padding: 17 },
  indexHeader: { alignItems: 'center', backgroundColor: 'transparent', flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { color: colors.white, fontSize: 18, fontWeight: '800' },
  indexScore: { color: colors.cyan, fontSize: 22, fontWeight: '800' },
  indexLabel: { color: colors.cyan, fontSize: 15, fontWeight: '700', marginTop: 5 },
  progressTrack: { backgroundColor: colors.line, borderRadius: 8, height: 8, marginTop: 12, overflow: 'hidden' },
  progress: { backgroundColor: colors.cyan, borderRadius: 8, height: 8 },
  cardHint: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 10 },
  factorRow: { alignItems: 'center', backgroundColor: 'transparent', flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  factorLabel: { color: colors.muted, fontSize: 12 },
  factorPoints: { color: colors.cyan, fontSize: 12, fontWeight: '800' },
  negativePoints: { color: '#ff9b91' },
  metrics: { backgroundColor: 'transparent', flexDirection: 'row', gap: 8, marginTop: 12 },
  metric: { backgroundColor: colors.panel, borderRadius: 13, flex: 1, padding: 12 },
  metricLabel: { color: colors.muted, fontSize: 11 },
  metricValue: { color: colors.white, fontSize: 15, fontWeight: '700', marginTop: 5 },
  chart: { backgroundColor: colors.panel, borderRadius: 16, marginTop: 12, padding: 15 },
  chartTrend: { color: colors.cyan, fontSize: 14, marginTop: 4 },
  chartLabels: { backgroundColor: 'transparent', flexDirection: 'row', justifyContent: 'space-between' },
  chartLabel: { color: colors.muted, fontSize: 12 },
  forecastCard: { backgroundColor: colors.panel, borderRadius: 16, marginTop: 12, padding: 15 },
  sunText: { color: colors.muted, fontSize: 12, marginTop: 5 },
  forecastScroll: { marginTop: 10 },
  forecastItem: { backgroundColor: colors.panelLight, borderRadius: 10, marginRight: 8, minWidth: 72, padding: 8 },
  forecastTime: { color: colors.muted, fontSize: 11 },
  forecastTemperature: { color: colors.white, fontSize: 18, fontWeight: '800', marginTop: 4 },
  forecastRain: { color: colors.cyan, fontSize: 11, marginTop: 4 },
  forecastWind: { color: colors.muted, fontSize: 11, marginTop: 3 },
  feedback: { alignItems: 'center', backgroundColor: 'transparent', gap: 14, marginTop: 50, padding: 20 },
  error: { color: '#ff9b91', textAlign: 'center' },
  button: { alignItems: 'center', backgroundColor: colors.cyan, borderRadius: 12, marginTop: 16, padding: 14, width: '100%' },
  buttonText: { color: colors.page, fontSize: 16, fontWeight: '800' },
});
