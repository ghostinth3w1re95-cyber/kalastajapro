import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import type { ReactNode } from 'react';

import { Text } from '@/components/Themed';

const colors = {
  page: '#071a2a',
  card: '#102d45',
  border: '#2b526c',
  text: '#f5fbff',
  muted: '#9bb3c1',
  accent: '#5dd8e6',
};

export default function PrivacyScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Tietoa ja tietosuoja',
          headerBackTitle: 'Takaisin',
          headerStyle: { backgroundColor: colors.page },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Tietoa sovelluksesta</Text>
        <Text style={styles.subtitle}>
          Kalastuspro auttaa arvioimaan kalastusolosuhteita ja pitää saalispäiväkirjan
          laitteen omassa tallennustilassa.
        </Text>

        <InfoCard title="Sijainti">
          <Text style={styles.body}>
            Sijaintia käytetään nykyisen sään hakemiseen ja oman sijainnin näyttämiseen
            kartalla. Sijaintilupa voidaan evätä, jolloin säässä käytetään Helsingin
            oletussijaintia.
          </Text>
        </InfoCard>

        <InfoCard title="Säätiedot">
          <Text style={styles.body}>
            Sää haetaan Open-Meteo-palvelusta. Sovellus lähettää palveluun säähaun
            koordinaatit ja vastaanottaa säätiedot. Open-Meteo ei vaadi tähän sovellukseen
            henkilökohtaista API-avainta.
          </Text>
        </InfoCard>

        <InfoCard title="Saalit, paikat ja kuvat">
          <Text style={styles.body}>
            Saaliit ja kalastuspaikat tallennetaan puhelimen paikalliseen SQLite-tietokantaan.
            Valitut saaliskuvat kopioidaan sovelluksen omaan tallennustilaan. Niitä ei
            lähetetä Kalastuspro-sovelluksen omalle palvelimelle.
          </Text>
        </InfoCard>

        <InfoCard title="Käyttöoikeudet">
          <Text style={styles.body}>
            Sovellus voi pyytää sijaintilupaa karttaa ja säätä varten sekä kuvakirjaston
            käyttöoikeutta saaliskuvia varten. Kameraa ja mikrofonia ei käytetä.
          </Text>
        </InfoCard>

        <View style={styles.versionCard}>
          <Text style={styles.versionLabel}>Kalastuspro</Text>
          <Text style={styles.versionText}>Versio 1.0.0</Text>
        </View>
      </ScrollView>
    </>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
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
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
  },
  cardTitle: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: '800',
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  versionCard: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 24,
  },
  versionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  versionText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
});
