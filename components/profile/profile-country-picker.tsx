import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import type { CountryOption } from '@/lib/utils/country-options';
import { flagEmojiFromIso2 } from '@/lib/utils/country-display';

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

interface ProfileCountryPickerProps {
  value: string;
  onChange: (code: string) => void;
  options: CountryOption[];
  notSetLabel: string;
  sheetTitle: string;
  searchPlaceholder: string;
  noMatchesLabel: string;
}

export function ProfileCountryPicker({
  value,
  onChange,
  options,
  notSetLabel,
  sheetTitle,
  searchPlaceholder,
  noMatchesLabel,
}: ProfileCountryPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { height } = useWindowDimensions();

  const q = normalizeQuery(query);
  const showNotSetRow = !q || notSetLabel.toLowerCase().includes(q);

  const filteredCountries = useMemo(() => {
    if (!q) return options;
    return options.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [options, q]);

  const listRows = useMemo(() => {
    const rows: { code: string; label: string; flag?: string }[] = [];
    if (showNotSetRow) rows.push({ code: '', label: notSetLabel });
    for (const c of filteredCountries) {
      rows.push({
        code: c.code,
        label: `${c.name} (${c.code})`,
        flag: flagEmojiFromIso2(c.code),
      });
    }
    return rows;
  }, [showNotSetRow, filteredCountries, notSetLabel]);

  const selectedLabel = useMemo(() => {
    if (!value) return notSetLabel;
    const row = options.find((c) => c.code === value);
    return row ? row.name : value;
  }, [value, options, notSetLabel]);

  function pick(code: string) {
    onChange(code);
    setOpen(false);
    setQuery('');
  }

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        accessibilityRole="button"
        accessibilityLabel={selectedLabel}>
        <View style={styles.triggerInner}>
          {value ? (
            <Text style={styles.flag} accessibilityLabel={value}>
              {flagEmojiFromIso2(value)}
            </Text>
          ) : null}
          <Text style={styles.triggerText} numberOfLines={1}>
            {selectedLabel}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color="rgba(212, 183, 143, 0.65)" />
      </Pressable>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <View style={[styles.sheet, { maxHeight: height * 0.88 }]}>
            <View style={styles.sheetHeader}>
              <Body style={styles.sheetTitle}>{sheetTitle}</Body>
              <Pressable onPress={() => setOpen(false)} hitSlop={12} accessibilityRole="button">
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor={brandColors.tanMuted}
              style={styles.search}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <FlatList
              data={listRows}
              keyExtractor={(item) => item.code || '__notset__'}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Muted style={styles.empty}>{noMatchesLabel}</Muted>}
              renderItem={({ item }) => (
                <Pressable style={styles.row} onPress={() => pick(item.code)}>
                  {item.flag ? <Text style={styles.rowFlag}>{item.flag}</Text> : null}
                  <Text style={styles.rowText}>{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
  },
  triggerPressed: {
    opacity: 0.9,
  },
  triggerInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  flag: {
    fontSize: 20,
    lineHeight: 24,
  },
  triggerText: {
    flex: 1,
    fontSize: 16,
    color: brandColors.cream,
    fontWeight: '500',
  },
  modalSafe: {
    flex: 1,
    backgroundColor: brandColors.black,
  },
  sheet: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brandColors.frame,
    backgroundColor: 'rgba(29, 24, 15, 0.55)',
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.borderSubtle,
  },
  sheetTitle: {
    fontWeight: '700',
    color: brandColors.gold,
    fontSize: 15,
  },
  closeText: {
    fontSize: 18,
    color: brandColors.muted,
    paddingHorizontal: 4,
  },
  search: {
    marginHorizontal: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
    color: brandColors.cream,
    backgroundColor: 'rgba(11, 11, 11, 0.55)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(179, 139, 45, 0.12)',
  },
  rowFlag: {
    fontSize: 20,
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    color: brandColors.cream,
  },
  empty: {
    padding: 24,
    textAlign: 'center',
  },
});
