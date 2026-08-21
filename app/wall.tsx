import DateTimePicker from '@react-native-community/datetimepicker';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PourGridCard } from '@/components/split-the-g/pour-grid-card';
import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { fetchWallScores } from '@/lib/api/client';
import type { PourScore } from '@/lib/api/types';
import { useLocale } from '@/lib/i18n/locale-context';
import { flagEmojiFromIso2 } from '@/lib/utils/country-display';

type SortOption = 'newest' | 'oldest' | 'score_high' | 'score_low';
type PickerTarget = 'from' | 'to' | null;

const MIN_SCORE_OPTIONS = [0, 2, 3, 3.5, 4, 4.5] as const;
const SORT_OPTIONS: { value: SortOption; labelKey: 'wallSortNewest' | 'wallSortOldest' | 'wallSortScoreHigh' | 'wallSortScoreLow' }[] = [
  { value: 'newest', labelKey: 'wallSortNewest' },
  { value: 'oldest', labelKey: 'wallSortOldest' },
  { value: 'score_high', labelKey: 'wallSortScoreHigh' },
  { value: 'score_low', labelKey: 'wallSortScoreLow' },
];

function timestamp(value: string | null | undefined): number {
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(time) ? time : 0;
}

function score(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function startOfDay(value: Date): number {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function endOfDay(value: Date): number {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

function dateLabel(value: Date | null, fallback: string): string {
  if (!value) return fallback;
  return value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function pairs<T>(items: T[]): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += 2) output.push(items.slice(index, index + 2));
  return output;
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.chipPressed]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Native counterpart of the web's `/wall` collage: all public scores with the same filters. */
export default function WallScreen() {
  const { t, tVars } = useLocale();
  const wall = useQuery({
    queryKey: ['scores', 'wall-collection'],
    queryFn: () => fetchWallScores(120),
    staleTime: 180_000,
  });

  const [sort, setSort] = useState<SortOption>('newest');
  const [minimumScore, setMinimumScore] = useState<number>(0);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [countryCode, setCountryCode] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [countryModalOpen, setCountryModalOpen] = useState(false);

  const countryOptions = useMemo(() => {
    const codes = new Set<string>();
    for (const item of wall.data ?? []) {
      const code = item.country_code?.trim().toUpperCase();
      if (code && /^[A-Z]{2}$/.test(code)) codes.add(code);
    }
    return [...codes].sort().map((code) => ({ code, label: `${flagEmojiFromIso2(code)} ${code}` }));
  }, [wall.data]);

  const filtered = useMemo(() => {
    const from = dateFrom ? startOfDay(dateFrom) : null;
    const to = dateTo ? endOfDay(dateTo) : null;
    const selectedCountry = countryCode.trim().toUpperCase();
    const next = (wall.data ?? []).filter((item) => {
      if (score(item.split_score) < minimumScore) return false;
      const createdAt = timestamp(item.created_at);
      if (from != null && createdAt < from) return false;
      if (to != null && createdAt > to) return false;
      if (selectedCountry && item.country_code?.trim().toUpperCase() !== selectedCountry) return false;
      return true;
    });

    return [...next].sort((left, right) => {
      if (sort === 'oldest') return timestamp(left.created_at) - timestamp(right.created_at);
      if (sort === 'score_high') return score(right.split_score) - score(left.split_score);
      if (sort === 'score_low') return score(left.split_score) - score(right.split_score);
      return timestamp(right.created_at) - timestamp(left.created_at);
    });
  }, [countryCode, dateFrom, dateTo, minimumScore, sort, wall.data]);

  const gridRows = useMemo(() => pairs(filtered), [filtered]);
  const selectedCountryLabel = countryOptions.find((item) => item.code === countryCode)?.label ?? t('wallAnyCountry');
  const canClearFilters = minimumScore !== 0 || dateFrom != null || dateTo != null || countryCode !== '' || sort !== 'newest';

  function clearFilters() {
    setSort('newest');
    setMinimumScore(0);
    setDateFrom(null);
    setDateTo(null);
    setCountryCode('');
  }

  function setDate(next: Date | undefined) {
    if (!next || !pickerTarget) return;
    if (pickerTarget === 'from') setDateFrom(next);
    else setDateTo(next);
  }

  return (
    <Screen
      edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}
      refreshControl={
        <RefreshControl
          refreshing={wall.isRefetching}
          onRefresh={() => void wall.refetch()}
          tintColor={brandColors.gold}
        />
      }>
      <View style={styles.header}>
        <Eyebrow>{t('wallEyebrow')}</Eyebrow>
        <Title>{t('wallCollectionTitle')}</Title>
        <Muted>{t('wallCollectionSubtitle')}</Muted>
      </View>

      <Card style={styles.filterCard}>
        <View style={styles.filterHeader}>
          <View>
            <Body style={styles.filterTitle}>{t('wallFilters')}</Body>
            {!wall.isLoading ? (
              <Muted style={styles.filterCount}>{tVars('wallShownCount', { filtered: filtered.length, total: wall.data?.length ?? 0 })}</Muted>
            ) : null}
          </View>
          <Pressable onPress={() => setFiltersOpen((current) => !current)} style={styles.filterToggle} accessibilityRole="button">
            <Text style={styles.filterToggleLabel}>{filtersOpen ? t('wallHideFilters') : t('wallShowFilters')}</Text>
          </Pressable>
        </View>

        {filtersOpen ? (
          <View style={styles.filterBody}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>{t('wallSortBy')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {SORT_OPTIONS.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={t(option.labelKey)}
                    active={sort === option.value}
                    onPress={() => setSort(option.value)}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>{t('wallMinimumScore')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {MIN_SCORE_OPTIONS.map((value) => (
                  <FilterChip
                    key={value}
                    label={value === 0 ? t('wallAnyScore') : `${value.toFixed(value % 1 === 0 ? 0 : 1)}+`}
                    active={minimumScore === value}
                    onPress={() => setMinimumScore(value)}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>{t('wallDateRange')}</Text>
              <View style={styles.dateRow}>
                <Pressable onPress={() => setPickerTarget('from')} style={styles.dateButton} accessibilityRole="button">
                  <Text style={styles.dateButtonLabel}>{t('wallFrom')}</Text>
                  <Text style={styles.dateButtonValue}>{dateLabel(dateFrom, t('wallAnyDate'))}</Text>
                </Pressable>
                <Pressable onPress={() => setPickerTarget('to')} style={styles.dateButton} accessibilityRole="button">
                  <Text style={styles.dateButtonLabel}>{t('wallTo')}</Text>
                  <Text style={styles.dateButtonValue}>{dateLabel(dateTo, t('wallAnyDate'))}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>{t('wallCountry')}</Text>
              <Pressable
                onPress={() => setCountryModalOpen(true)}
                style={styles.countryButton}
                accessibilityRole="button"
                accessibilityLabel={`${t('wallCountry')}: ${selectedCountryLabel}`}>
                <Text style={styles.countryButtonText}>{selectedCountryLabel}</Text>
                <Text style={styles.chevron}>⌄</Text>
              </Pressable>
            </View>

            {canClearFilters ? <AppButton label={t('wallClearFilters')} variant="secondary" compact onPress={clearFilters} /> : null}
          </View>
        ) : null}
      </Card>

      {wall.isLoading ? <ScreenLoadingBlock /> : null}
      {wall.error ? (
        <Card>
          <Body>{t('wallLoadError')}</Body>
          <Muted>{wall.error.message}</Muted>
        </Card>
      ) : null}
      {!wall.isLoading && !wall.error && filtered.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Body style={styles.emptyTitle}>{t('wallEmptyTitle')}</Body>
          <Muted style={styles.emptyHint}>{t('wallEmptyHint')}</Muted>
          {canClearFilters ? <AppButton label={t('wallClearFilters')} variant="secondary" onPress={clearFilters} /> : null}
        </Card>
      ) : null}

      {!wall.isLoading && !wall.error && gridRows.length > 0 ? (
        <View style={styles.grid}>
          {gridRows.map((row, rowIndex) => (
            <View key={`wall-row-${rowIndex}`} style={styles.gridRow}>
              {row.map((item: PourScore) => (
                <View key={item.id} style={styles.gridCell}>
                  <PourGridCard score={item} />
                </View>
              ))}
              {row.length === 1 ? <View style={styles.gridCell} /> : null}
            </View>
          ))}
        </View>
      ) : null}

      <Modal visible={pickerTarget != null} transparent animationType="fade" onRequestClose={() => setPickerTarget(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.dateModal}>
            <Text style={styles.modalTitle}>{pickerTarget === 'from' ? t('wallFrom') : t('wallTo')}</Text>
            <DateTimePicker
              value={pickerTarget === 'from' ? dateFrom ?? new Date() : dateTo ?? new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={(_event, nextDate) => {
                setDate(nextDate);
                if (Platform.OS !== 'ios') setPickerTarget(null);
              }}
            />
            {Platform.OS === 'ios' ? <AppButton label={t('wallDone')} compact onPress={() => setPickerTarget(null)} /> : null}
          </View>
        </View>
      </Modal>

      <Modal visible={countryModalOpen} transparent animationType="slide" onRequestClose={() => setCountryModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.countryModal}>
            <Text style={styles.modalTitle}>{t('wallChooseCountry')}</Text>
            <ScrollView contentContainerStyle={styles.countryList}>
              <FilterChip
                label={t('wallAnyCountry')}
                active={countryCode === ''}
                onPress={() => {
                  setCountryCode('');
                  setCountryModalOpen(false);
                }}
              />
              {countryOptions.map((item) => (
                <FilterChip
                  key={item.code}
                  label={item.label}
                  active={countryCode === item.code}
                  onPress={() => {
                    setCountryCode(item.code);
                    setCountryModalOpen(false);
                  }}
                />
              ))}
            </ScrollView>
            <AppButton label={t('actionCancel')} variant="secondary" onPress={() => setCountryModalOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 8, paddingTop: 6 },
  filterCard: { gap: 14 },
  filterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  filterTitle: { fontWeight: '800', color: brandColors.cream },
  filterCount: { marginTop: 2, fontSize: 12 },
  filterToggle: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: brandColors.pourCardStroke },
  filterToggleLabel: { color: brandColors.goldBright, fontSize: 12, fontWeight: '800' },
  filterBody: { gap: 14 },
  filterGroup: { gap: 7 },
  filterLabel: { color: 'rgba(212, 183, 143, 0.75)', fontSize: 12, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase' },
  chipRow: { gap: 8, paddingRight: 8 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: brandColors.pourCardStroke, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: 'rgba(11, 11, 11, 0.38)' },
  chipActive: { backgroundColor: brandColors.gold, borderColor: brandColors.gold },
  chipPressed: { opacity: 0.84 },
  chipLabel: { color: 'rgba(212, 183, 143, 0.9)', fontSize: 13, fontWeight: '700' },
  chipLabelActive: { color: brandColors.black },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateButton: { flex: 1, minWidth: 0, borderRadius: 10, borderWidth: 1, borderColor: brandColors.pourCardStroke, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: 'rgba(11, 11, 11, 0.38)' },
  dateButtonLabel: { color: 'rgba(212, 183, 143, 0.55)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  dateButtonValue: { color: brandColors.cream, fontSize: 13, fontWeight: '600', marginTop: 4 },
  countryButton: { borderRadius: 10, borderWidth: 1, borderColor: brandColors.pourCardStroke, backgroundColor: 'rgba(11, 11, 11, 0.38)', minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countryButtonText: { color: brandColors.cream, fontSize: 14, fontWeight: '600' },
  chevron: { color: brandColors.goldBright, fontSize: 18 },
  grid: { gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12 },
  gridCell: { flex: 1, minWidth: 0 },
  emptyCard: { alignItems: 'center', paddingVertical: 28 },
  emptyTitle: { fontWeight: '800', textAlign: 'center' },
  emptyHint: { textAlign: 'center' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.72)', padding: 16 },
  dateModal: { borderRadius: 16, borderWidth: 1, borderColor: brandColors.pourCardStroke, backgroundColor: brandColors.panel, padding: 18, gap: 14 },
  countryModal: { maxHeight: '76%', borderRadius: 16, borderWidth: 1, borderColor: brandColors.pourCardStroke, backgroundColor: brandColors.panel, padding: 18, gap: 14 },
  modalTitle: { color: brandColors.cream, fontSize: 18, fontWeight: '800' },
  countryList: { gap: 9, paddingBottom: 6 },
});
