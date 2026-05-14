import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CompetitionDateTimeRangeField } from '@/components/competition/competition-datetime-range-field';
import {
  CompetitionLocationField,
  type CompetitionLocationValue,
} from '@/components/competition/competition-location-field';
import {
  CompetitionFormHairline,
  CompetitionFormInset,
  CompetitionFormSection,
  competitionFormStyles,
} from '@/components/competition/competition-form-layout';
import { DiscoverSegmentHeader } from '@/components/split-the-g/discover-feed-chrome';
import { AppButton } from '@/components/split-the-g/button';
import { Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { Body, Muted } from '@/components/split-the-g/typography';
import { SCREEN_EDGE_GUTTER } from '@/constants/layout';
import { brandColors } from '@/constants/theme';
import { createCompetitionRow, fetchBarLinkOptions } from '@/lib/api/client';
import type { BarLinkOption } from '@/lib/api/types';
import { trackEvent } from '@/lib/analytics/client';
import { useAuth } from '@/lib/auth/auth-context';
import {
  GLASSES_PER_PERSON_UNLIMITED_SENTINEL,
  updateGlassesPerPersonForWinRule,
  validateCompetitionFormInput,
  type WinRuleChoice,
} from '@/lib/competition/edit-shared';
import { translationKeyForWinRule } from '@/lib/competition/win-rule-i18n';
import { useLocale } from '@/lib/i18n/locale-context';
import type { TranslationKey } from '@/lib/i18n/translations';

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
  const insets = useSafeAreaInsets();
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
        <DiscoverSegmentHeader eyebrow={t('competeEyebrow')} title={t('compCreateTitle')} subtitle={t('compCreateSignIn')} />
      </Screen>
    );
  }

  return (
    <Screen edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES} contentContainerStyle={styles.screenContent}>
      <DiscoverSegmentHeader
        eyebrow={t('competeEyebrow')}
        title={t('compCreateTitle')}
        subtitle={t('compCreateSubtitle')}
      />

      {barsQuery.isFetching && !barsQuery.data ? (
        <Muted style={styles.loadingHint}>{t('commonLoading')}</Muted>
      ) : null}

      <CompetitionFormSection title={t('compFormSectionDetails')} spacing="afterHero">
        <CompetitionFormInset>
          <View style={competitionFormStyles.stackedFieldPadding}>
            <Muted style={competitionFormStyles.stackedLabel}>{t('compEditFieldName')}</Muted>
            <TextInput
              value={form.title}
              onChangeText={(title) => setForm((f) => ({ ...f, title }))}
              style={competitionFormStyles.groupedInput}
              placeholderTextColor={brandColors.tanMuted}
              autoCorrect
              autoCapitalize="sentences"
            />
          </View>
          <CompetitionFormHairline />
          <View style={competitionFormStyles.stackedFieldPadding}>
            <Muted style={competitionFormStyles.stackedLabel}>{t('compEditFieldMaxParticipants')}</Muted>
            <TextInput
              value={form.maxParticipants}
              onChangeText={(maxParticipants) => setForm((f) => ({ ...f, maxParticipants }))}
              style={competitionFormStyles.groupedInput}
              keyboardType="number-pad"
              placeholderTextColor={brandColors.tanMuted}
            />
          </View>
          <CompetitionFormHairline />
          <View style={[competitionFormStyles.stackedFieldPadding, styles.glassesPad]}>
            <Muted style={competitionFormStyles.stackedLabel}>{t('compEditFieldGlasses')}</Muted>
            <TextInput
              value={form.glassesPerPerson}
              onChangeText={(glassesPerPerson) => setForm((f) => ({ ...f, glassesPerPerson }))}
              style={[competitionFormStyles.groupedInput, form.winRule === 'most_submissions' && styles.dimmed]}
              keyboardType="number-pad"
              placeholderTextColor={brandColors.tanMuted}
              editable={form.winRule !== 'most_submissions'}
            />
          </View>
        </CompetitionFormInset>
      </CompetitionFormSection>

      <CompetitionFormSection title={t('compFormSectionScoring')}>
        <CompetitionFormInset>
          <View style={styles.winRuleBlock}>
            <Muted style={[competitionFormStyles.stackedLabel, styles.winRuleHeading]}>
              {t('compEditFieldWinRule')}
            </Muted>
            <ScrollView
              horizontal
              nestedScrollEnabled
              directionalLockEnabled
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.winRuleScroll}>
              {winRuleSelectors}
            </ScrollView>
          </View>
          {form.winRule === 'closest_to_target' ? (
            <>
              <CompetitionFormHairline />
              <View style={[competitionFormStyles.stackedFieldPadding, styles.glassesPad]}>
                <Muted style={competitionFormStyles.stackedLabel}>{t('compEditFieldTarget')}</Muted>
                <TextInput
                  value={form.targetScore}
                  onChangeText={(targetScore) => setForm((f) => ({ ...f, targetScore }))}
                  style={competitionFormStyles.groupedInput}
                  keyboardType="decimal-pad"
                  placeholderTextColor={brandColors.tanMuted}
                />
              </View>
            </>
          ) : null}
        </CompetitionFormInset>
      </CompetitionFormSection>

      <CompetitionFormSection title={t('compFormSectionSchedule')}>
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
          emptyValueLabel={t('compFormPickDateTime')}
          presentation="grouped"
        />
      </CompetitionFormSection>

      <CompetitionFormSection title={t('compFormSectionDiscovery')}>
        <CompetitionFormInset>
          <View style={competitionFormStyles.switchRow}>
            <Body style={[competitionFormStyles.switchBody, { color: brandColors.cream }]} accessibilityRole="text">
              {form.isPublic ? t('compEditPublic') : t('compEditPrivate')}
            </Body>
            <Switch
              accessibilityRole="switch"
              accessibilityState={{ checked: form.isPublic }}
              value={form.isPublic}
              onValueChange={(v) => setForm((f) => ({ ...f, isPublic: v }))}
              trackColor={{
                false: 'rgba(60, 60, 60, 0.9)',
                true: 'rgba(179, 139, 45, 0.65)',
              }}
              ios_backgroundColor="rgba(60, 60, 60, 0.9)"
              thumbColor={form.isPublic ? brandColors.goldBright : '#888'}
            />
          </View>
        </CompetitionFormInset>
      </CompetitionFormSection>

      <CompetitionFormSection title={t('compFormSectionVenue')}>
        <CompetitionLocationField
          value={form.location}
          onChange={(location) => setForm((f) => ({ ...f, location }))}
          venueNameLabel={t('compEditVenueName')}
          venueNamePlaceholder={t('compVenueNamePlaceholder')}
          venueAddressLabel={t('compEditVenueAddress')}
          presentation="grouped"
        />
      </CompetitionFormSection>

      <CompetitionFormSection title={t('compFormSectionPubLink')}>
        <CompetitionFormInset>
          <Pressable
            android_ripple={{ color: 'rgba(197, 160, 89, 0.12)' }}
            onPress={() => setPubPickerOpen(true)}
            style={({ pressed }) => [
              competitionFormStyles.pickerRow,
              pressed && styles.pressedRow,
            ]}
            accessibilityRole="button">
            <View style={competitionFormStyles.pickerTexts}>
              <Muted style={styles.pubPickerEyebrow}>{t('compCreatePickPub')}</Muted>
              <Body style={styles.pubPickerValue} numberOfLines={2}>
                {selectedPubLabel}
              </Body>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(197, 160, 89, 0.45)" />
          </Pressable>
        </CompetitionFormInset>
        <Muted style={styles.linkedPubHint}>{t('compCreatePubHint')}</Muted>
      </CompetitionFormSection>

      <View style={competitionFormStyles.footerActions}>
        {errorText ? (
          <Body style={styles.err} accessibilityRole="alert">
            {errorText}
          </Body>
        ) : null}
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

      <Modal visible={pubPickerOpen} animationType="slide" transparent onRequestClose={() => setPubPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismiss} accessibilityRole="button" onPress={() => setPubPickerOpen(false)} />
          <View style={[styles.modalCard, { paddingBottom: Math.max(20, 12 + insets.bottom) }]}>
            <View style={styles.modalGrab} />
            <Body style={styles.modalTitle}>{t('compCreatePickPub')}</Body>
            <FlatList
              data={[{ bar_key: '', display_name: t('compCreatePubNone') } as BarLinkOption].concat(barsQuery.data ?? [])}
              keyExtractor={(item) => item.bar_key || '_none'}
              style={styles.modalList}
              renderItem={({ item }) => (
                <Pressable
                  android_ripple={{ color: 'rgba(197, 160, 89, 0.08)' }}
                  style={({ pressed }) => [styles.pubRow, pressed && styles.pubRowPressed]}
                  onPress={() => {
                    setForm((f) => ({ ...f, linkedBarKey: item.bar_key }));
                    setPubPickerOpen(false);
                  }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Body>{item.display_name || item.bar_key}</Body>
                    {item.bar_key ? <Muted style={styles.mono}>{item.bar_key}</Muted> : null}
                  </View>
                  {form.linkedBarKey === item.bar_key ? (
                    <Ionicons name="checkmark-circle" size={22} color={brandColors.goldBright} />
                  ) : (
                    <Ionicons name="ellipse-outline" size={22} color="rgba(197,160,89,0.25)" />
                  )}
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
  screenContent: {
    gap: 0,
  },
  loadingHint: {
    marginTop: -4,
    marginBottom: 10,
    fontSize: 13,
  },
  pressedRow: { backgroundColor: 'rgba(29, 24, 15, 0.55)' },
  glassesPad: { paddingBottom: 4 },
  winRuleBlock: {
    paddingTop: 10,
    paddingBottom: 4,
    paddingLeft: 14,
    gap: 10,
  },
  winRuleHeading: { marginBottom: 2 },
  winRuleScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
    paddingBottom: 8,
    gap: 10,
    flexWrap: 'nowrap',
  },
  ruleChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brandColors.frame,
    backgroundColor: 'rgba(11, 11, 11, 0.25)',
  },
  ruleChipOn: {
    borderColor: brandColors.gold,
    backgroundColor: 'rgba(179, 139, 45, 0.22)',
    borderWidth: 1,
  },
  ruleChipText: { fontSize: 13.5, color: brandColors.muted, fontWeight: '600' },
  ruleChipTextOn: { color: brandColors.goldBright, fontWeight: '800' },
  dimmed: { opacity: 0.42 },
  pubPickerEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.35,
  },
  pubPickerValue: {
    marginTop: 3,
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
    color: brandColors.cream,
  },
  linkedPubHint: {
    marginTop: 10,
    fontSize: 12,
    paddingHorizontal: 2,
    lineHeight: 17,
    color: brandColors.tanMuted,
  },
  err: {
    color: brandColors.red,
    fontWeight: '600',
    paddingHorizontal: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalDismiss: { flex: 1 },
  modalCard: {
    backgroundColor: brandColors.black,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: SCREEN_EDGE_GUTTER,
    paddingTop: 10,
    maxHeight: '78%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: brandColors.borderSubtle,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 28,
  },
  modalGrab: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(212,183,143,0.35)',
    marginBottom: 4,
  },
  modalTitle: { fontWeight: '800', fontSize: 18, letterSpacing: -0.2, marginBottom: 4 },
  modalList: { maxHeight: 360 },
  pubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: brandColors.borderSubtle,
    gap: 12,
  },
  pubRowPressed: { backgroundColor: 'rgba(29, 24, 15, 0.65)' },
  mono: {
    fontSize: 11,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
});
