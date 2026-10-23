import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import Svg, { Rect } from 'react-native-svg';

import { Text } from '@/components/Themed';
import { getCatchRecords, type CatchRecord } from '@/database/database';
import { createCatchSummary } from '@/services/catchStatistics';

const colors = {
  page: '#071a2a',
  card: '#102d45',
  border: '#2b526c',
  text: '#f5fbff',
  muted: '#9bb3c1',
  accent: '#5dd8e6',
};

export default function StatsScreen() {
  const [records, setRecords] = useState<CatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getCatchRecords()
      .then((loadedRecords) => {
        if (isMounted) {
          setRecords(loadedRecords);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Saaliiden tilastoja ei voitu ladata.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    return createCatchSummary(records);
  }, [records]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Omat tilastot',
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
        <Text style={styles.title}>Omat tilastot</Text>
        <Text style={styles.subtitle}>Yhteenveto tallentamistasi saaliista</Text>

        {isLoading ? (
          <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />
        ) : error ? (
          <View style={styles.messageCard}>
            <Text style={styles.message}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.grid}>
              <StatCard label="Saalita" value={`${records.length}`} />
              <StatCard label="Kokonaispaino" value={`${formatWeight(summary.totalWeight)} g`} />
              <StatCard
                label="Keskipaino"
                value={`${formatWeight(summary.averageWeight)} g`}
              />
              <StatCard
                label="Suurin saalis"
                value={summary.heaviestCatch ? `${formatWeight(summary.heaviestCatch.weight)} g` : '-'}
              />
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.cardTitle}>Suurin saalis</Text>
              {summary.heaviestCatch ? (
                <>
                  <Text style={styles.catchSpecies}>{summary.heaviestCatch.species}</Text>
                  <Text style={styles.detailText}>
                    {formatWeight(summary.heaviestCatch.weight)} g · {summary.heaviestCatch.date}
                  </Text>
                  <Text style={styles.detailText}>{summary.heaviestCatch.location}</Text>
                </>
              ) : (
                <Text style={styles.detailText}>
                  Lisää ensimmäinen saalis, niin näet tilastot täällä.
                </Text>
              )}
            </View>
            <View style={styles.detailsCard}>
              <Text style={styles.cardTitle}>Muut tilastot</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Yleisin laji</Text>
                <Text style={styles.detailValue}>
                  {summary.mostCommonSpecies
                    ? `${summary.mostCommonSpecies.name} (${summary.mostCommonSpecies.count})`
                    : '-'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Viimeisin saalis</Text>
                <Text style={styles.detailValue}>
                  {summary.latestCatch ? summary.latestCatch.date : '-'}
                </Text>
              </View>
            </View>
            <CountSection title="Saalit lajeittain" counts={summary.speciesCounts} />
            <CountSection title="Saalit paikoittain" counts={summary.locationCounts} />
            <BarChart title="Lajijakauma" counts={summary.speciesCounts} />
          </>
        )}
      </ScrollView>
    </>
  );
}

function BarChart({ title, counts }: { title: string; counts: Record<string, number> }) {
  const entries = Object.entries(counts).sort(([, first], [, second]) => second - first).slice(0, 6);
  const max = Math.max(...entries.map(([, count]) => count), 1);
  const width = 320;
  const barHeight = 22;
  const gap = 12;

  return (
    <View style={styles.detailsCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      {entries.length === 0 ? (
        <Text style={styles.detailText}>Tietoja ei ole vielä.</Text>
      ) : (
        <Svg height={entries.length * (barHeight + gap)} width="100%" viewBox={`0 0 ${width} ${entries.length * (barHeight + gap)}`}>
          {entries.map(([name, count], index) => (
            <Rect
              key={name}
              fill={colors.accent}
              height={barHeight}
              rx={5}
              width={(count / max) * (width - 16)}
              x={0}
              y={index * (barHeight + gap)}
            />
          ))}
        </Svg>
      )}
      {entries.map(([name, count]) => (
        <View key={`${name}-label`} style={styles.countRow}>
          <Text style={styles.detailLabel}>{name}</Text>
          <Text style={styles.countValue}>{count}</Text>
        </View>
      ))}
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatWeight(weight: number) {
  return Number.isInteger(weight) ? `${weight}` : weight.toFixed(1);
}

function CountSection({ title, counts }: { title: string; counts: Record<string, number> }) {
  const entries = Object.entries(counts).sort(([, first], [, second]) => second - first);

  return (
    <View style={styles.detailsCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      {entries.length === 0 ? (
        <Text style={styles.detailText}>Tietoja ei ole vielä.</Text>
      ) : (
        entries.map(([name, count]) => (
          <View key={name} style={styles.countRow}>
            <Text style={styles.detailLabel}>{name}</Text>
            <Text style={styles.countValue}>{count}</Text>
          </View>
        ))
      )}
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
    marginTop: 4,
  },
  loader: {
    marginTop: 48,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 22,
  },
  statCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 104,
    padding: 14,
    width: '48%',
  },
  statValue: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 8,
  },
  detailsCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  catchSpecies: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 14,
  },
  detailText: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 6,
  },
  detailRow: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  detailLabel: {
    color: colors.muted,
    flex: 1,
    fontSize: 14,
  },
  detailValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  countRow: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  countValue: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '800',
  },
  messageCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginTop: 22,
    padding: 16,
  },
  message: {
    color: colors.text,
  },
});
