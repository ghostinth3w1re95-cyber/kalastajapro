import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { getFishingSpots, type FishingSpot } from '@/database/database';

export default function WebMapScreen() {
  const [spots, setSpots] = useState<FishingSpot[]>([]);

  useEffect(() => {
    void getFishingSpots().then(setSpots);
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Kartta</Text>
      <Text style={styles.description}>
        Karttanäkymä toimii mobiililaitteella. Web-versiossa tallennetut paikat
        näkyvät tässä listana, jotta voit testata tietokantatoimintoja selaimessa.
      </Text>
      {spots.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.muted}>Tallennettuja kalastuspaikkoja ei ole vielä.</Text>
        </View>
      ) : (
        spots.map((spot) => (
          <View key={spot.id} style={styles.card}>
            <Text style={styles.name}>{spot.name}</Text>
            <Text style={styles.muted}>
              {spot.latitude.toFixed(5)}, {spot.longitude.toFixed(5)}
            </Text>
          </View>
        ))
      )}
      <Pressable style={styles.infoButton}>
        <Text style={styles.infoText}>Avaa mobiiliversio karttaa varten</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#071a2a', flexGrow: 1, padding: 16 },
  title: { color: '#f5fbff', fontSize: 28, fontWeight: '800' },
  description: { color: '#9db4c2', fontSize: 14, lineHeight: 20, marginTop: 8 },
  card: { backgroundColor: '#102d45', borderRadius: 14, marginTop: 14, padding: 16 },
  name: { color: '#f5fbff', fontSize: 17, fontWeight: '700' },
  muted: { color: '#9db4c2', fontSize: 13, marginTop: 5 },
  infoButton: { backgroundColor: '#5dd8e6', borderRadius: 10, marginTop: 18, padding: 14 },
  infoText: { color: '#071a2a', fontWeight: '700', textAlign: 'center' },
});
