import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { PourGridCard } from '@/components/split-the-g/pour-grid-card';
import { Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import type { PourScore, PubWallScoreRow } from '@/lib/api/types';
import { useLocale } from '@/lib/i18n/locale-context';
import {
  filterSortPubWallRows,
  PUB_WALL_PAGE_SIZE,
  type PubWallSort,
  wallCountryCodesFromRows,
} from '@/lib/pub/wall-filters';

const MIN_SCORE_CHOICES = ['0', '2', '3', '3.5', '4', '4.5'] as const;

function wallRowToPourScore(row: PubWallScoreRow): PourScore {
  return {
    id: row.id,
    slug: row.slug ?? null,
    split_score: row.split_score,
    split_image_url: null,
    pint_image_url: row.pint_image_url ?? null,
    g_closeup_image_url: null,
    username: row.username,
    city: row.city ?? null,
    region: row.region ?? null,
    country: null,
    country_code: row.country_code ?? null,
    created_at: row.created_at,
    bar_name: row.bar_name ?? null,
    bar_address: row.bar_address ?? null,
    google_place_id: null,
    pour_rating: null,
    pint_price: row.pint_price ?? null,
    session_id: null,
    submitter_user_id: null,
    email: null,
    email_opted_out: null,
  };
}

interface OptionRow {
  value: string;
  label: string;
}

function ChoiceModal({
  visible,
  title,
  options,
  onPick,
  onClose,
  cancelLabel,
}: {
  visible: boolean;
  title: string;
  options: OptionRow[];
  onPick: (value: string) => void;
  onClose: () => void;
  cancelLabel: string;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
          <Text style={styles.modalTitle}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value || '__any__'}
            style={styles.modalList}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.modalRow, pressed && styles.modalRowPressed]}
                onPress={() => {
                  onPick(item.value);
                  onClose();
                }}>
                <Text style={styles.modalRowLabel}>{item.label}</Text>
              </Pressable>
            )}
          />
          <AppButton label={cancelLabel} variant="ghost" onPress={onClose} />
        </View>
      </Pressable>
    </Modal>
  );
}

interface PubWallPanelProps {
  items: PubWallScoreRow[];
  wallError: string | null;
}

export function PubWallPanel({ items, wallError }: PubWallPanelProps) {
  const { t } = useLocale();
  const [sort, setSort] = useState<PubWallSort>('newest');
  const [minScore, setMinScore] = useState('0');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [sheet, setSheet] = useState<'sort' | 'min' | 'country' | null>(null);

  function sortLabel(s: PubWallSort): string {
    switch (s) {
      case 'oldest':
        return t('pubDetailWallSortOldest');
      case 'score_high':
        return t('pubDetailWallSortScoreHigh');
      case 'score_low':
        return t('pubDetailWallSortScoreLow');
      default:
        return t('pubDetailWallSortNewest');
    }
  }

  function minLabel(v: string): string {
    if (v === '0') return t('pubDetailWallAnyScore');
    return `${v}+`;
  }

  const countryMeta = useMemo(() => wallCountryCodesFromRows(items), [items]);
  const nameByCode = useMemo(() => new Map(countryMeta.map((c) => [c.code, c.name] as const)), [countryMeta]);

  function countryTriggerLabel(): string {
    const c = countryFilter.trim().toUpperCase();
    if (!c) return t('pubDetailWallAnyCountry');
    const name = nameByCode.get(c) ?? c;
    const flag =
      c.length === 2
        ? String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 - 65 + ch.charCodeAt(0)))
        : '';
    return flag ? `${flag} ${name}` : name;
  }

  const filtered = useMemo(
    () => filterSortPubWallRows(items, { sort, minScore, dateFrom, dateTo, countryFilter }),
    [items, sort, minScore, dateFrom, dateTo, countryFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [sort, minScore, dateFrom, dateTo, countryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PUB_WALL_PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const safePage = Math.min(Math.max(1, page), totalPages);

  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * PUB_WALL_PAGE_SIZE;
    return filtered.slice(start, start + PUB_WALL_PAGE_SIZE);
  }, [filtered, safePage]);

  const pagerSummary =
    filtered.length === 1
      ? t('pubDetailWallPagerOne')
          .replace(/\{count\}/g, String(filtered.length))
          .replace(/\{page\}/g, String(safePage))
          .replace(/\{totalPages\}/g, String(totalPages))
      : t('pubDetailWallPagerMany')
          .replace(/\{count\}/g, String(filtered.length))
          .replace(/\{page\}/g, String(safePage))
          .replace(/\{totalPages\}/g, String(totalPages));

  const sortOptions: OptionRow[] = [
    { value: 'newest', label: t('pubDetailWallSortNewest') },
    { value: 'oldest', label: t('pubDetailWallSortOldest') },
    { value: 'score_high', label: t('pubDetailWallSortScoreHigh') },
    { value: 'score_low', label: t('pubDetailWallSortScoreLow') },
  ];

  const minScoreOptions: OptionRow[] = MIN_SCORE_CHOICES.map((v) => ({ value: v, label: minLabel(v) }));

  const countryOptions: OptionRow[] = (() => {
    const rows: OptionRow[] = [{ value: '', label: t('pubDetailWallAnyCountry') }];
    for (const c of countryMeta) {
      const flag =
        c.code.length === 2
          ? String.fromCodePoint(...[...c.code.toUpperCase()].map((ch) => 0x1f1e6 - 65 + ch.charCodeAt(0)))
          : '';
      rows.push({ value: c.code, label: flag ? `${flag} ${c.name}` : c.name });
    }
    return rows;
  })();

  function resetFilters() {
    setMinScore('0');
    setDateFrom('');
    setDateTo('');
    setCountryFilter('');
    setSort('newest');
  }

  if (wallError) {
    return <Muted>{t('pubDetailWallError').replace(/\{message\}/g, wallError)}</Muted>;
  }

  if (items.length === 0) {
    return <Muted>{t('pubDetailWallEmpty')}</Muted>;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.filterCard}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>{t('pubDetailWallFilters')}</Text>
          <View style={styles.filterHeaderRight}>
            <Text style={styles.pagerMeta}>{pagerSummary}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: filtersOpen }}
              onPress={() => setFiltersOpen((o) => !o)}
              style={styles.toggleFilters}>
              <Text style={styles.toggleFiltersText}>{filtersOpen ? t('pubDetailWallHide') : t('pubDetailWallShow')}</Text>
            </Pressable>
          </View>
        </View>

        {filtersOpen ? (
          <View style={styles.filterGrid}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('pubDetailWallSortBy')}</Text>
              <Pressable style={styles.selectTrigger} onPress={() => setSheet('sort')}>
                <Text style={styles.selectTriggerText}>{sortLabel(sort)}</Text>
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('pubDetailWallMinScore')}</Text>
              <Pressable style={styles.selectTrigger} onPress={() => setSheet('min')}>
                <Text style={styles.selectTriggerText}>{minLabel(minScore)}</Text>
              </Pressable>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.field, styles.fieldGrow]}>
                <Text style={styles.fieldLabel}>{t('pubDetailWallDateFrom')}</Text>
                <TextInput
                  value={dateFrom}
                  onChangeText={setDateFrom}
                  placeholder={t('pubDetailWallDatePlaceholder')}
                  placeholderTextColor="rgba(212, 183, 143, 0.35)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
              </View>
              <View style={[styles.field, styles.fieldGrow]}>
                <Text style={styles.fieldLabel}>{t('pubDetailWallDateTo')}</Text>
                <TextInput
                  value={dateTo}
                  onChangeText={setDateTo}
                  placeholder={t('pubDetailWallDatePlaceholder')}
                  placeholderTextColor="rgba(212, 183, 143, 0.35)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('pubDetailWallCountry')}</Text>
              <Pressable style={styles.selectTrigger} onPress={() => setSheet('country')}>
                <Text style={styles.selectTriggerText} numberOfLines={1}>
                  {countryTriggerLabel()}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      {pageSlice.length === 0 ? (
        <View style={styles.noMatch}>
          <Muted>{t('pubDetailWallNoMatch')}</Muted>
          <AppButton label={t('pubDetailWallResetFilters')} variant="primary" onPress={resetFilters} />
        </View>
      ) : (
        <View style={styles.gridContent}>
          {Array.from({ length: Math.ceil(pageSlice.length / 2) }, (_, rowIdx) => {
            const a = pageSlice[rowIdx * 2];
            const b = pageSlice[rowIdx * 2 + 1];
            return (
              <View key={a.id} style={styles.gridRow}>
                <View style={styles.gridCell}>
                  <PourGridCard score={wallRowToPourScore(a)} hideVenueRow />
                </View>
                {b ? (
                  <View style={styles.gridCell}>
                    <PourGridCard score={wallRowToPourScore(b)} hideVenueRow />
                  </View>
                ) : (
                  <View style={styles.gridCell} />
                )}
              </View>
            );
          })}
        </View>
      )}

      {totalPages > 1 ? (
        <View style={styles.pager}>
          <AppButton
            label={t('pubDetailWallPrevious')}
            variant="secondary"
            disabled={safePage <= 1}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
          />
          <Text style={styles.pageOf}>
            {t('pubDetailWallPageOf').replace(/\{page\}/g, String(safePage)).replace(/\{totalPages\}/g, String(totalPages))}
          </Text>
          <AppButton
            label={t('pubDetailWallNext')}
            variant="secondary"
            disabled={safePage >= totalPages}
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </View>
      ) : null}

      <ChoiceModal
        visible={sheet === 'sort'}
        title={t('pubDetailWallSortBy')}
        options={sortOptions}
        cancelLabel={t('actionCancel')}
        onClose={() => setSheet(null)}
        onPick={(v) => setSort(v as PubWallSort)}
      />
      <ChoiceModal
        visible={sheet === 'min'}
        title={t('pubDetailWallMinScore')}
        options={minScoreOptions}
        cancelLabel={t('actionCancel')}
        onClose={() => setSheet(null)}
        onPick={setMinScore}
      />
      <ChoiceModal
        visible={sheet === 'country'}
        title={t('pubDetailWallCountry')}
        options={countryOptions}
        cancelLabel={t('actionCancel')}
        onClose={() => setSheet(null)}
        onPick={setCountryFilter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  filterCard: {
    borderWidth: 1,
    borderColor: brandColors.frame,
    borderRadius: 12,
    backgroundColor: 'rgba(29, 24, 15, 0.35)',
    padding: 14,
    gap: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  filterTitle: {
    color: brandColors.goldBright,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  filterHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flex: 1,
  },
  pagerMeta: {
    flexShrink: 1,
    color: 'rgba(212, 183, 143, 0.55)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  toggleFilters: {
    borderWidth: 1,
    borderColor: brandColors.frame,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
  },
  toggleFiltersText: {
    color: brandColors.goldBright,
    fontSize: 12,
    fontWeight: '700',
  },
  filterGrid: {
    gap: 14,
    marginTop: 4,
  },
  field: {
    gap: 6,
  },
  fieldGrow: {
    flex: 1,
    minWidth: 0,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldLabel: {
    color: 'rgba(212, 183, 143, 0.78)',
    fontSize: 12,
    fontWeight: '600',
  },
  selectTrigger: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.28)',
    borderRadius: 10,
    backgroundColor: 'rgba(11, 11, 11, 0.55)',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  selectTriggerText: {
    color: brandColors.cream,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.28)',
    borderRadius: 10,
    backgroundColor: 'rgba(11, 11, 11, 0.55)',
    paddingHorizontal: 12,
    color: brandColors.cream,
    fontSize: 14,
  },
  noMatch: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.15)',
    borderRadius: 12,
    backgroundColor: 'rgba(29, 24, 15, 0.28)',
  },
  gridContent: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  gridCell: {
    flex: 1,
    minWidth: 0,
  },
  pager: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  pageOf: {
    color: 'rgba(212, 183, 143, 0.65)',
    fontSize: 12,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: brandColors.panel,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: brandColors.frame,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    maxHeight: '72%',
  },
  modalTitle: {
    color: brandColors.goldBright,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  modalList: {
    marginBottom: 8,
  },
  modalRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.borderSubtle,
  },
  modalRowPressed: {
    backgroundColor: 'rgba(179, 139, 45, 0.08)',
  },
  modalRowLabel: {
    color: brandColors.cream,
    fontSize: 16,
    fontWeight: '600',
  },
});
