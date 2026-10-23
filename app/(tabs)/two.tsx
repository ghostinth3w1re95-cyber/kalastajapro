import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View as RNView,
} from 'react-native';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import MapView, { Marker, type MapPressEvent, type Region } from 'react-native-maps';

import { Text, View } from '@/components/Themed';
import {
  addFishingSpot,
  getFishingSpots,
  type FishingSpot,
} from '@/database/database';

const DEFAULT_REGION: Region = {
  latitude: 60.1699,
  longitude: 24.9384,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export default function TabTwoScreen() {
  const params = useLocalSearchParams<{ latitude?: string; longitude?: string }>();
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [locationStatus, setLocationStatus] = useState<
    'loading' | 'granted' | 'denied'
  >('loading');
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [pendingCoordinate, setPendingCoordinate] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [spotName, setSpotName] = useState('');

  useEffect(() => {
    const latitude = Number(params.latitude);
    const longitude = Number(params.longitude);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      // Route parameters are external input that must synchronize the map view.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRegion((current) => ({ ...current, latitude, longitude }));
    }

    void getFishingSpots()
      .then(setSpots)
      .catch(() => {
        Alert.alert('Tietokantavirhe', 'Kalastuspaikkoja ei voitu ladata.');
      });

    async function requestLocation() {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setLocationStatus('denied');
        return;
      }

      setLocationStatus('granted');
      const currentLocation = await Location.getCurrentPositionAsync({});
      setRegion((current) => ({
        ...current,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      }));
    }

    void requestLocation().catch(() => {
      setLocationStatus('denied');
    });
  }, [params.latitude, params.longitude]);

  function handleMapPress(event: MapPressEvent) {
    setPendingCoordinate(event.nativeEvent.coordinate);
    setSpotName('');
  }

  function saveSpot() {
    if (!pendingCoordinate || !spotName.trim()) {
      return;
    }

    void addFishingSpot(
      spotName.trim(),
      pendingCoordinate.latitude,
      pendingCoordinate.longitude
    )
      .then(async () => {
        setSpots(await getFishingSpots());
        setPendingCoordinate(null);
        setSpotName('');
      })
      .catch(() => {
        Alert.alert('Tallennusvirhe', 'Kalastuspaikkaa ei voitu tallentaa.');
      });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>OMAT PAIKAT</Text>
        <Text style={styles.title}>Kalastuspaikat</Text>
        <Text style={styles.subtitle}>Löydä oma paikkasi ja merkitse parhaat rannat kartalle.</Text>
      </View>
      {locationStatus === 'loading' && (
        <View style={styles.status}>
          <ActivityIndicator />
          <Text style={styles.statusText}>Haetaan sijaintilupaa...</Text>
        </View>
      )}
      {locationStatus === 'denied' && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>
            Sijaintilupaa ei myönnetty. Kartta toimii silti Helsingin oletussijainnilla.
          </Text>
          <Pressable
            onPress={() =>
              Alert.alert(
                'Sijaintilupa',
                'Voit sallia sijainnin iPhonen Asetukset-sovelluksesta.'
              )
            }
          >
            <Text style={styles.link}>Miten sallin sijainnin?</Text>
          </Pressable>
        </View>
      )}
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation={locationStatus === 'granted'}
        showsMyLocationButton={locationStatus === 'granted'}
      >
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
            title={spot.name}
            description={`${spot.latitude.toFixed(5)}, ${spot.longitude.toFixed(5)}`}
          >
            <RNView style={styles.spotMarker}>
              <Text style={styles.spotMarkerIcon}>🐟</Text>
            </RNView>
          </Marker>
        ))}
        {pendingCoordinate && (
          <Marker coordinate={pendingCoordinate} title="Uusi kalastuspaikka">
            <RNView style={styles.pendingMarker}>
              <Text style={styles.pendingMarkerIcon}>＋</Text>
            </RNView>
          </Marker>
        )}
      </MapView>
      {pendingCoordinate && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Uusi kalastuspaikka</Text>
          <TextInput
            placeholder="Paikan nimi"
            value={spotName}
            onChangeText={setSpotName}
            style={styles.input}
            autoFocus
          />
          <View style={styles.formActions}>
            <Pressable
              style={styles.cancelButton}
              onPress={() => setPendingCoordinate(null)}
            >
              <Text style={styles.cancelText}>Peruuta</Text>
            </Pressable>
            <Pressable
              style={[styles.saveButton, !spotName.trim() && styles.disabledButton]}
              onPress={saveSpot}
              disabled={!spotName.trim()}
            >
              <Text style={styles.saveText}>Lisää paikka</Text>
            </Pressable>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#071a2a',
    flex: 1,
    paddingTop: 12,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#c9dbe2',
    fontSize: 16,
    marginTop: 8,
  },
  header: {
    backgroundColor: '#102d45',
    borderRadius: 22,
    marginHorizontal: 20,
    padding: 20,
  },
  eyebrow: {
    color: '#91d4dc',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  status: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },
  statusText: {
    color: '#f5fbff',
  },
  warning: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  warningText: {
    color: '#ffd28a',
  },
  link: {
    color: '#176b87',
    fontWeight: '600',
    marginTop: 4,
  },
  map: {
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 12,
    marginTop: 14,
    overflow: 'hidden',
  },
  form: {
    backgroundColor: '#102d45',
    borderRadius: 14,
    elevation: 4,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  formTitle: {
    color: '#f5fbff',
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#173b56',
    borderColor: '#2b526c',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 10,
    color: '#f5fbff',
  },
  spotMarker: {
    alignItems: 'center',
    backgroundColor: '#1aa6b7',
    borderColor: '#f5fbff',
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  spotMarkerIcon: {
    fontSize: 18,
  },
  pendingMarker: {
    alignItems: 'center',
    backgroundColor: '#ffb84d',
    borderColor: '#fff',
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pendingMarkerIcon: {
    color: '#071a2a',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 25,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  cancelButton: {
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  cancelText: {
    color: '#f5fbff',
  },
  saveButton: {
    backgroundColor: '#5dd8e6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveText: {
    color: '#071a2a',
    fontWeight: '700',
  },
});
