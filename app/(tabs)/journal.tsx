import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View as RNView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

import { Text, View } from '@/components/Themed';
import {
  addCatchRecord,
  deleteCatchRecord,
  getFishingSpots,
  getCatchRecords,
  updateCatchRecord,
  type CatchRecord,
  type FishingSpot,
} from '@/database/database';

const colors = {
  page: '#071a2a',
  card: '#102d45',
  navy: '#f5fbff',
  blue: '#1aa6b7',
  muted: '#9bb3c1',
  border: '#2b526c',
  paleBlue: '#173f59',
  red: '#ff8b86',
};

export default function JournalScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<CatchRecord[]>([]);
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [species, setSpecies] = useState('');
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function loadRecords() {
    try {
      setRecords(await getCatchRecords());
    } catch {
      Alert.alert('Tietokantavirhe', 'Saaliita ei voitu ladata.');
    }
  }

  async function loadSpots() {
    try {
      setSpots(await getFishingSpots());
    } catch {
      Alert.alert('Tietokantavirhe', 'Kalastuspaikkoja ei voitu ladata.');
    }
  }

  useEffect(() => {
    // The database request synchronizes persisted records into component state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRecords();
    void loadSpots();
  }, []);

  async function chooseImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Kuvien käyttö estetty',
        'Salli kuvien käyttö iPhonen asetuksista, jos haluat lisätä kuvan saaliiseen.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageChanged(true);
    }
  }

  async function copyImageToAppStorage(uri: string): Promise<string> {
    if (!FileSystem.documentDirectory) {
      throw new Error('Sovelluksen tallennustilaa ei voitu avata.');
    }
    const directory = `${FileSystem.documentDirectory}catch-photos/`;
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    const destination = `${directory}${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: uri, to: destination });
    return destination;
  }

  async function saveRecord() {
    const numericWeight = Number(weight.replace(',', '.'));
    if (!species.trim() || !Number.isFinite(numericWeight) || numericWeight <= 0 || !date) {
      Alert.alert('Tarkista tiedot', 'Anna laji, positiivinen paino ja päivämäärä.');
      return;
    }

    setIsSaving(true);
    try {
      const storedImageUri =
        imageChanged && imageUri ? await copyImageToAppStorage(imageUri) : imageUri;
      const normalizedLocation = location.trim() || 'Ei määritetty';
      if (editingId === null) {
        await addCatchRecord(
          species.trim(),
          numericWeight,
          date,
          normalizedLocation,
          storedImageUri
        );
      } else {
        await updateCatchRecord(
          editingId,
          species.trim(),
          numericWeight,
          date,
          normalizedLocation,
          storedImageUri
        );
      }
      resetForm();
      await loadRecords();
    } catch {
      Alert.alert('Tallennusvirhe', 'Saalista tai kuvaa ei voitu tallentaa.');
    } finally {
      setIsSaving(false);
    }
  }

  function resetForm() {
    setSpecies('');
    setWeight('');
    setDate(new Date().toISOString().slice(0, 10));
    setLocation('');
    setImageUri(null);
    setImageChanged(false);
    setEditingId(null);
    setSelectedSpotId(null);
  }

  function startEditing(record: CatchRecord) {
    setEditingId(record.id);
    setSpecies(record.species);
    setWeight(String(record.weight));
    setDate(record.date);
    setLocation(record.location === 'Ei määritetty' ? '' : record.location);
    setSelectedSpotId(
      spots.find((spot) => spot.name === record.location)?.id ?? null
    );
    setImageUri(record.imageUri);
    setImageChanged(false);
  }

  function selectSpot(spot: FishingSpot) {
    setSelectedSpotId(spot.id);
    setLocation(spot.name);
  }

  function removeRecord(id: number) {
    Alert.alert('Poista saalis?', 'Tietoa ei voi palauttaa poiston jälkeen.', [
      { text: 'Peruuta', style: 'cancel' },
      {
        text: 'Poista',
        style: 'destructive',
        onPress: () => {
          void deleteCatchRecord(id)
            .then(loadRecords)
            .catch(() => Alert.alert('Poistovirhe', 'Saalista ei voitu poistaa.'));
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Pressable style={styles.statsCard} onPress={() => router.push('/stats')}>
        <View style={styles.statsIcon}>
          <Text style={styles.fishIcon}>🐟</Text>
        </View>
        <View style={styles.statsText}>
          <Text style={styles.statsTitle}>Omat tilastot</Text>
          <Text style={styles.statsSubtitle}>Näe kalastuspäiväkirjasi yhteenveto</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Saalit</Text>
      {records.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🐟</Text>
          <Text style={styles.emptyTitle}>Ei saaliita vielä</Text>
          <Text style={styles.emptyText}>Lisää ensimmäinen saalis alla olevalla lomakkeella.</Text>
        </View>
      ) : (
        records.map((record) => (
          <CatchCard
            key={record.id}
            record={record}
            onEdit={() => startEditing(record)}
            onDelete={() => removeRecord(record.id)}
          />
        ))
      )}

      <View style={styles.addCard}>
        <Text style={styles.addTitle}>
          {editingId === null ? 'Lisää uusi saalis' : 'Muokkaa saalista'}
        </Text>
        <Text style={styles.addSubtitle}>Tallenna laji, paino, paikka ja kuva.</Text>
        <TextInput
          placeholder="Laji, esimerkiksi ahven"
          placeholderTextColor={colors.muted}
          value={species}
          onChangeText={setSpecies}
          style={styles.input}
        />
        <RNView style={styles.row}>
          <TextInput
            placeholder="Paino (g)"
            placeholderTextColor={colors.muted}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            style={[styles.input, styles.halfInput]}
          />
          <TextInput
            placeholder="VVVV-KK-PP"
            placeholderTextColor={colors.muted}
            value={date}
            onChangeText={setDate}
            style={[styles.input, styles.halfInput]}
          />
        </RNView>
        <TextInput
          placeholder="Kalastuspaikka (valinnainen)"
          placeholderTextColor={colors.muted}
          value={location}
          onChangeText={(text) => {
            setLocation(text);
            setSelectedSpotId(spots.find((spot) => spot.name === text)?.id ?? null);
          }}
          style={styles.input}
        />
        {spots.length > 0 ? (
          <View style={styles.spotSelector}>
            <Text style={styles.spotSelectorTitle}>Valitse tallennettu paikka</Text>
            <RNView style={styles.spotList}>
              {spots.map((spot) => (
                <Pressable
                  key={spot.id}
                  onPress={() => selectSpot(spot)}
                  style={[
                    styles.spotOption,
                    selectedSpotId === spot.id && styles.selectedSpotOption,
                  ]}
                >
                  <Text
                    style={[
                      styles.spotOptionText,
                      selectedSpotId === spot.id && styles.selectedSpotOptionText,
                    ]}
                  >
                    {spot.name}
                  </Text>
                </Pressable>
              ))}
            </RNView>
          </View>
        ) : null}
        <Pressable style={styles.photoButton} onPress={() => void chooseImage()}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} />
          ) : (
            <Text style={styles.photoIcon}>＋</Text>
          )}
          <View style={styles.photoText}>
            <Text style={styles.photoTitle}>
              {imageUri ? 'Kuva valittu' : 'Lisää saaliskuva'}
            </Text>
            <Text style={styles.photoHint}>Valitse kuva kuvakirjastosta</Text>
          </View>
        </Pressable>
        <Pressable
          style={[styles.saveButton, isSaving && styles.disabledButton]}
          onPress={() => void saveRecord()}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving
              ? 'Tallennetaan...'
              : editingId === null
                ? 'Tallenna saalis'
                : 'Tallenna muutokset'}
          </Text>
        </Pressable>
        {editingId !== null ? (
          <Pressable style={styles.cancelButton} onPress={resetForm} disabled={isSaving}>
            <Text style={styles.cancelButtonText}>Peruuta muokkaus</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

function CatchCard({
  record,
  onEdit,
  onDelete,
}: {
  record: CatchRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.catchCard}>
      {record.imageUri ? (
        <Image source={{ uri: record.imageUri }} style={styles.catchImage} />
      ) : (
        <View style={styles.catchImagePlaceholder}>
          <Text style={styles.placeholderFish}>🐟</Text>
        </View>
      )}
      <View style={styles.catchContent}>
        <View style={styles.catchTopRow}>
          <Text style={styles.catchSpecies}>{record.species}</Text>
          <Text style={styles.catchDate}>{record.date}</Text>
        </View>
        <Text style={styles.catchWeight}>{record.weight} g</Text>
        <View style={styles.locationRow}>
          <Text style={styles.locationDot}>●</Text>
          <Text style={styles.catchLocation}>{record.location}</Text>
        </View>
        <Pressable onPress={onEdit} style={styles.editButton}>
          <Text style={styles.editButtonText}>Muokkaa</Text>
        </Pressable>
      </View>
      <Pressable onPress={onDelete} hitSlop={10} style={styles.deleteButton}>
        <Text style={styles.delete}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.page,
  },
  container: {
    backgroundColor: colors.page,
    flexGrow: 1,
    padding: 16,
    paddingBottom: 36,
  },
  statsCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    flexDirection: 'row',
    padding: 12,
  },
  statsIcon: {
    alignItems: 'center',
    backgroundColor: colors.paleBlue,
    borderRadius: 10,
    height: 54,
    justifyContent: 'center',
    width: 70,
  },
  fishIcon: {
    fontSize: 30,
  },
  statsText: {
    backgroundColor: 'transparent',
    flex: 1,
    marginLeft: 12,
  },
  statsTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '800',
  },
  statsSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  chevron: {
    color: colors.muted,
    fontSize: 30,
    fontWeight: '300',
    paddingHorizontal: 6,
  },
  sectionTitle: {
    color: colors.navy,
    fontSize: 23,
    fontWeight: '800',
    marginBottom: 10,
    marginTop: 24,
  },
  catchCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 10,
    minHeight: 96,
    overflow: 'hidden',
    paddingRight: 10,
  },
  catchImage: {
    height: 96,
    width: 92,
  },
  catchImagePlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.paleBlue,
    height: 96,
    justifyContent: 'center',
    width: 92,
  },
  placeholderFish: {
    fontSize: 34,
  },
  catchContent: {
    backgroundColor: 'transparent',
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  catchTopRow: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catchSpecies: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '600',
  },
  catchDate: {
    color: colors.muted,
    fontSize: 10,
  },
  catchWeight: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 5,
  },
  locationRow: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    marginTop: 5,
  },
  locationDot: {
    color: '#1bb891',
    fontSize: 11,
  },
  catchLocation: {
    color: colors.muted,
    fontSize: 11,
    marginLeft: 5,
  },
  editButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.paleBlue,
    borderRadius: 6,
    marginTop: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editButtonText: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '700',
  },
  deleteButton: {
    alignSelf: 'flex-start',
    paddingTop: 8,
  },
  delete: {
    color: colors.red,
    fontSize: 20,
    fontWeight: '500',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
  },
  emptyIcon: {
    fontSize: 30,
  },
  emptyTitle: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  addCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginTop: 20,
    padding: 16,
  },
  addTitle: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: '800',
  },
  addSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 3,
  },
  input: {
    backgroundColor: '#0b2337',
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.navy,
    marginTop: 10,
    padding: 12,
  },
  spotSelector: {
    backgroundColor: 'transparent',
    marginTop: 12,
  },
  spotSelectorTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  spotList: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  spotOption: {
    backgroundColor: colors.paleBlue,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  selectedSpotOption: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  spotOptionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  selectedSpotOptionText: {
    color: colors.page,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  photoButton: {
    alignItems: 'center',
    backgroundColor: colors.paleBlue,
    borderRadius: 10,
    flexDirection: 'row',
    marginTop: 12,
    minHeight: 62,
    padding: 8,
  },
  photoIcon: {
    alignItems: 'center',
    backgroundColor: '#cde9ed',
    borderRadius: 9,
    color: colors.blue,
    fontSize: 27,
    height: 44,
    lineHeight: 41,
    textAlign: 'center',
    width: 44,
  },
  preview: {
    borderRadius: 8,
    height: 48,
    width: 64,
  },
  photoText: {
    backgroundColor: 'transparent',
    marginLeft: 10,
  },
  photoTitle: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '700',
  },
  photoHint: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderRadius: 10,
    marginTop: 12,
    padding: 13,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: 10,
    padding: 8,
  },
  cancelButtonText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
});
