import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { CompetitionDateTimeRangeField } from '@/components/competition/competition-datetime-range-field';
import {
  CompetitionLocationField,
  type CompetitionLocationValue,
} from '@/components/competition/competition-location-field';
import { AppButton } from '@/components/split-the-g/button';
import { Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { createCompetitionRow, fetchBarLinkOptions } from '@/lib/api/client';
import type { BarLinkOption } from '@/lib/api/types';
import {
  GLASSES_PER_PERSON_UNLIMITED_SENTINEL,
  updateGlassesPerPersonForWinRule,
  validateCompetitionFormInput,
  type WinRuleChoice,
} from '@/lib/competition/edit-shared';
import { translationKeyForWinRule } from '@/lib/competition/win-rule-i18n';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';
import type { TranslationKey } from '@/lib/i18n/translations';
import { trackEvent } from '@/lib/analytics/client';

const WIN_RULES: WinRuleChoice[] = [
  'highest_score',
  'lowest_score',
  'best_average',
  'closest_to_target',
  'most_submissions',
];

function nativeCompetitionRef(id: string, pathSegment: string | null): string {
  const seg = pathSegment?.trim();
  return encodeURIComponent(seg || id);
}

export default function CreateCompetitionScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { t, tVars } = useLocale();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '',
    maxParticipants: '8',
    glassesPerPerson: '1',
    startsAt: '',
    endsAt: '',
    isPublic: true,
    winRule: 'highest_score' as WinRuleChoice,
    targetScore: '2.50',
    location: {
      name: '',
      address: '',
      lat: null,
      lng: null,
      placeId: null,
    } as CompetitionLocationValue,
    linkedBarKey: '',
  });
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const [errorVars, setErrorVars] = useState<Record<string, string> | undefined>();
  const [pubPickerOpen, setPubPickerOpen] = useState(false);

  const barsQuery = useQuery({ queryKey: ['barLinkOptions'], queryFn: fetchBarLinkOptions });

  const selectedPubLabel = useMemo(() => {
    const key = form.linkedBarKey.trim();
    if (!key) return t('compCreatePubNone');
    const row = barsQuery.data?.find((b) => b.bar_key === key);
    return row ? row.display_name : key;
  }, [form.linkedBarKey, barsQuery.data, t]);

  const createMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('auth');
      const maxParticipants = parseInt(form.maxParticipants, 10);
      let glassesPerPerson = parseInt(form.glassesPerPerson, 10);
      if (!Number.isFinite(maxParticipants) || maxParticipants < 1) {
        setErrorKey('competeErrGeneric');
        throw new Error('validate');
      }
      if (form.winRule === 'most_submissions') {
        glassesPerPerson = GLASSES_PER_PERSON_UNLIMITED_SENTINEL;
      } else if (!Number.isFinite(glassesPerPerson) || glassesPerPerson < 1) {
        setErrorKey('competeErrGeneric');
        throw new Error('validate');
      }

      const validated = validateCompetitionFormInput({
        title: form.title,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        maxParticipants,
        winRule: form.winRule,
        targetScore: form.targetScore,
        participantCount: 0,
      });
      if (!validated.ok) {
        setErrorKey(validated.key);
        setErrorVars(validated.vars);
        throw new Error('validate');
      }

      const starts = new Date(form.startsAt).toISOString();
      const ends = new Date(form.endsAt).toISOString();

      const inserted = await createCompetitionRow({
        title: form.title.trim(),
        created_by: user.id,
        max_participants: maxParticipants,
        glasses_per_person: glassesPerPerson,
        starts_at: starts,
        ends_at: ends,
        win_rule: form.winRule,
        target_score: form.winRule === 'closest_to_target' ? validated.target : null,
        visibility: form.isPublic ? 'public' : 'private',
        location_name: form.location.name.trim() || null,
        location_address: form.location.address.trim() || null,
        linked_bar_key: form.linkedBarKey.trim() || null,
      });

      trackEvent('competition_created', {
        competitionId: inserted.id,
        visibility: form.isPublic ? 'public' : 'private',
        winRule: form.winRule,
      });

      await qc.invalidateQueries({ queryKey: ['competitions', 'catalog'] });
      router.replace(`/competition/${nativeCompetitionRef(inserted.id, inserted.path_segment)}`);
    },
    onError: (e: Error) => {
      if (e.message === 'validate') return;
      if (e.message === 'auth') setErrorKey('compCreateSignIn');
      else setErrorKey('compCreateErrNoRow');
    },
  });

  const errorText =
    errorKey != null ? (errorVars ? tVars(errorKey, errorVars as Record<string, string | number>) : t(errorKey)) : null;

  const winRuleSelectors = useMemo(
    () =>
      WIN_RULES.map((r) => (
        <Pressable
          key={r}
          onPress={() => {
            setForm((f) => ({
              ...f,
              winRule: r,
              glassesPerPerson: String(updateGlassesPerPersonForWinRule(r, parseInt(f.glassesPerPerson, 10) || 1)),
            }));
          }}
          style={[styles.ruleChip, form.winRule === r && styles.ruleChipOn]}
          accessibilityRole="button">
          <Body style={[styles.ruleChipText, form.winRule === r && styles.ruleChipTextOn]}>
            {t(translationKeyForWinRule(r))}
          </Body>
        </Pressable>
      )),
    [form.winRule, t],
  );

  if (!user) {
    return (
      <Screen edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
        <View style={styles.header}>
          <Eyebrow>{t('competeEyebrow')}</Eyebrow>
          <Title>{t('compCreateTitle')}</Title>
          <Muted>{t('compCreateSignIn')}</Muted>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
      <View style={styles.header}>
        <Eyebrow>{t('competeEyebrow')}</Eyebrow>
        <Title>{t('compCreateTitle')}</Title>
        <Muted>{t('compCreateSubtitle')}</Muted>
      </View>

      <View style={styles.card}>
        <Muted>{t('compEditFieldName')}</Muted>
        <TextInput
          value={form.title}
          onChangeText={(title) => setForm((f) => ({ ...f, title }))}
          style={styles.input}
          placeholderTextColor={brandColors.tanMuted}
        />
        <Muted>{t('compEditFieldMaxParticipants')}</Muted>
        <TextInput
          value={form.maxParticipants}
          onChangeText={(maxParticipants) => setForm((f) => ({ ...f, maxParticipants }))}
          style={styles.input}
          keyboardType="number-pad"
          placeholderTextColor={brandColors.tanMuted}
        />
        <Muted>{t('compEditFieldGlasses')}</Muted>
        <TextInput
          value={form.glassesPerPerson}
          onChangeText={(glassesPerPerson) => setForm((f) => ({ ...f, glassesPerPerson }))}
          style={styles.input}
          keyboardType="number-pad"
          placeholderTextColor={brandColors.tanMuted}
          editable={form.winRule !== 'most_submissions'}
        />
        <Muted>{t('compEditFieldWinRule')}</Muted>
        <View style={styles.ruleRow}>{winRuleSelectors}</View>
        {form.winRule === 'closest_to_target' ? (
          <>
            <Muted>{t('compEditFieldTarget')}</Muted>
            <TextInput
              value={form.targetScore}
              onChangeText={(targetScore) => setForm((f) => ({ ...f, targetScore }))}
              style={styles.input}
              keyboardType="decimal-pad"
              placeholderTextColor={brandColors.tanMuted}
            />
          </>
        ) : null}
        <CompetitionDateTimeRangeField
          startsAt={form.startsAt}
          endsAt={form.endsAt}
          onChangeStartsAt={(startsAt) => setForm((f) => ({ ...f, startsAt }))}
          onChangeEndsAt={(endsAt) => setForm((f) => ({ ...f, endsAt }))}
          labelStart={t('compEditFieldStart')}
          labelEnd={t('compEditFieldEnd')}
          pickStartTitle={t('competitionPickStart')}
          pickEndTitle={t('competitionPickEnd')}
          doneLabel={t('competitionPickerDone')}
          cancelLabel={t('competitionPickerCancel')}
        />
        <Pressable
          onPress={() => setForm((f) => ({ ...f, isPublic: !f.isPublic }))}
          style={styles.toggle}
          accessibilityRole="button">
          <Body>{form.isPublic ? t('compEditPublic') : t('compEditPrivate')}</Body>
        </Pressable>
        <CompetitionLocationField
          value={form.location}
          onChange={(location) => setForm((f) => ({ ...f, location }))}
          venueNameLabel={t('compEditVenueName')}
          venueNamePlaceholder={t('compVenueNamePlaceholder')}
          venueAddressLabel={t('compEditVenueAddress')}
        />
        <Muted>{t('compCreateFieldLinkedPub')}</Muted>
        <Muted style={styles.hint}>{t('compCreatePubHint')}</Muted>
        <AppButton label={`${t('compCreatePickPub')}: ${selectedPubLabel}`} variant="secondary" onPress={() => setPubPickerOpen(true)} />
        {errorText ? <Body style={styles.err}>{errorText}</Body> : null}
        <AppButton
          label={createMut.isPending ? t('compCreateSaving') : t('compCreateSubmit')}
          disabled={createMut.isPending}
          onPress={() => {
            setErrorKey(null);
            setErrorVars(undefined);
            createMut.mutate();
          }}
        />
        <AppButton label={t('compEditCancel')} variant="secondary" onPress={() => router.back()} />
      </View>

      <Modal visible={pubPickerOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Title style={styles.modalTitle}>{t('compCreatePickPub')}</Title>
            <FlatList
              data={[{ bar_key: '', display_name: t('compCreatePubNone') } as BarLinkOption].concat(barsQuery.data ?? [])}
              keyExtractor={(item) => item.bar_key || '_none'}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.pubRow}
                  onPress={() => {
                    setForm((f) => ({ ...f, linkedBarKey: item.bar_key }));
                    setPubPickerOpen(false);
                  }}>
                  <Body>{item.display_name || item.bar_key}</Body>
                  {item.bar_key ? <Muted style={styles.mono}>{item.bar_key}</Muted> : null}
                </Pressable>
              )}
            />
            <AppButton label={t('compEditCancel')} variant="secondary" onPress={() => setPubPickerOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 10, paddingTop: 8 },
  card: { gap: 8, paddingBottom: 24 },
  hint: { fontSize: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    borderRadius: 10,
    padding: 12,
    color: brandColors.cream,
    marginBottom: 12,
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
  },
  ruleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  ruleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brandColors.frame,
  },
  ruleChipOn: {
    borderColor: brandColors.gold,
    backgroundColor: 'rgba(179, 139, 45, 0.15)',
  },
  ruleChipText: { fontSize: 13, color: brandColors.muted },
  ruleChipTextOn: { color: brandColors.goldBright, fontWeight: '700' },
  toggle: { paddingVertical: 12, marginBottom: 12 },
  err: { color: brandColors.red, marginBottom: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: brandColors.black,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
    gap: 12,
    borderWidth: 1,
    borderColor: brandColors.frame,
  },
  modalTitle: { marginBottom: 8 },
  pubRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: brandColors.frame },
  mono: { fontSize: 11, marginTop: 4 },
});
