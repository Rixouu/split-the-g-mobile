import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

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
import { Card, Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import {
  fetchCompetitionByRef,
  fetchCompetitionParticipantCount,
  updateCompetitionDetails,
} from '@/lib/api/client';
import type { CompetitionDetail } from '@/lib/api/types';
import {
  GLASSES_PER_PERSON_UNLIMITED_SENTINEL,
  updateGlassesPerPersonForWinRule,
  isPrivateCompetitionVisibility,
  normalizeWinRuleChoice,
  toDatetimeLocalValue,
  validateCompetitionEdit,
  type WinRuleChoice,
} from '@/lib/competition/edit-shared';
import { translationKeyForWinRule } from '@/lib/competition/win-rule-i18n';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';

const WIN_RULES: WinRuleChoice[] = [
  'highest_score',
  'lowest_score',
  'best_average',
  'closest_to_target',
  'most_submissions',
];

function buildInitialState(c: CompetitionDetail) {
  const winRule = normalizeWinRuleChoice(c.win_rule);
  return {
    title: c.title,
    maxParticipants: String(c.max_participants),
    glassesPerPerson:
      winRule === 'most_submissions'
        ? String(GLASSES_PER_PERSON_UNLIMITED_SENTINEL)
        : String(c.glasses_per_person),
    startsAt: toDatetimeLocalValue(c.starts_at),
    endsAt: toDatetimeLocalValue(c.ends_at),
    isPublic: !isPrivateCompetitionVisibility(c.visibility),
    winRule,
    targetScore: c.target_score != null ? String(c.target_score) : '2.50',
    location: {
      name: c.location_name?.trim() ?? '',
      address: c.location_address?.trim() ?? '',
      lat: null,
      lng: null,
      placeId: null,
    } as CompetitionLocationValue,
    linkedBarKey: c.linked_bar_key?.trim() ?? '',
  };
}

export default function CompetitionEditScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { t } = useLocale();
  const { user } = useAuth();
  const raw = useLocalSearchParams<{ competitionId: string | string[] }>();
  const ref = (typeof raw.competitionId === 'string' ? raw.competitionId : raw.competitionId?.[0] ?? '').trim();

  const compQuery = useQuery({
    queryKey: ['competition', ref],
    queryFn: () => fetchCompetitionByRef(ref),
    enabled: Boolean(ref),
  });

  const c = compQuery.data;

  const participantQuery = useQuery({
    queryKey: ['competitionParticipants', c?.id],
    queryFn: () => fetchCompetitionParticipantCount(c!.id),
    enabled: Boolean(c?.id),
  });

  const [form, setForm] = useState<ReturnType<typeof buildInitialState> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!c) return;
    setForm(buildInitialState(c));
  }, [c]);

  const canEdit = Boolean(user && c && user.id === c.created_by);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!c || !form) throw new Error('Missing competition');
      const maxParticipants = parseInt(form.maxParticipants, 10);
      let glassesPerPerson = parseInt(form.glassesPerPerson, 10);
      if (!Number.isFinite(maxParticipants) || maxParticipants < 1) {
        throw new Error('Max participants must be a positive number.');
      }
      if (form.winRule === 'most_submissions') {
        glassesPerPerson = GLASSES_PER_PERSON_UNLIMITED_SENTINEL;
      } else if (!Number.isFinite(glassesPerPerson) || glassesPerPerson < 1) {
        throw new Error('Glasses per person must be at least 1.');
      }

      const validated = validateCompetitionEdit({
        title: form.title,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        maxParticipants,
        winRule: form.winRule,
        targetScore: form.targetScore,
        participantCount: participantQuery.data ?? 0,
      });
      if ('error' in validated) throw new Error(validated.error);

      const starts = new Date(form.startsAt).toISOString();
      const ends = new Date(form.endsAt).toISOString();

      await updateCompetitionDetails(c.id, {
        title: form.title.trim(),
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
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['competition', ref] });
      router.back();
    },
    onError: (e: Error) => setError(e.message),
  });

  const winRuleSelectors = useMemo(
    () =>
      WIN_RULES.map((r) => (
        <Pressable
          key={r}
          onPress={() => {
            if (!form) return;
            setForm({
              ...form,
              winRule: r,
              glassesPerPerson: String(updateGlassesPerPersonForWinRule(r, parseInt(form.glassesPerPerson, 10) || 1)),
            });
          }}
          style={[styles.ruleChip, form?.winRule === r && styles.ruleChipOn]}
          accessibilityRole="button">
          <Body style={[styles.ruleChipText, form?.winRule === r && styles.ruleChipTextOn]}>
            {t(translationKeyForWinRule(r))}
          </Body>
        </Pressable>
      )),
    [form, t],
  );

  if (compQuery.isLoading || !form) {
    return (
      <Screen edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
        <Card>
          <Body>{t('commonLoading')}</Body>
        </Card>
      </Screen>
    );
  }

  if (compQuery.error || !c) {
    return (
      <Screen edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
        <Card>
          <Body>{t('compEditLoadError')}</Body>
        </Card>
      </Screen>
    );
  }

  if (!canEdit) {
    return (
      <Screen edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
        <Card>
          <Body>{t('compEditNotAllowed')}</Body>
          <AppButton label={t('compEditBack')} variant="secondary" onPress={() => router.back()} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES} contentContainerStyle={styles.screenContent}>
      <DiscoverSegmentHeader
        eyebrow={t('competitionEyebrow')}
        title={t('compEditScreenTitle')}
        subtitle={c.title}
      />

      <CompetitionFormSection title={t('compFormSectionDetails')} spacing="afterHero">
        <CompetitionFormInset>
          <View style={competitionFormStyles.stackedFieldPadding}>
            <Muted style={competitionFormStyles.stackedLabel}>{t('compEditFieldName')}</Muted>
            <TextInput
              value={form.title}
              onChangeText={(title) => setForm({ ...form, title })}
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
              onChangeText={(maxParticipants) => setForm({ ...form, maxParticipants })}
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
              onChangeText={(glassesPerPerson) => setForm({ ...form, glassesPerPerson })}
              style={[
                competitionFormStyles.groupedInput,
                form.winRule === 'most_submissions' && styles.dimmed,
              ]}
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
                  onChangeText={(targetScore) => setForm({ ...form, targetScore })}
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
          onChangeStartsAt={(startsAt) => setForm({ ...form, startsAt })}
          onChangeEndsAt={(endsAt) => setForm({ ...form, endsAt })}
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
              onValueChange={(v) => setForm({ ...form, isPublic: v })}
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
          onChange={(location) => setForm({ ...form, location })}
          venueNameLabel={t('compEditVenueName')}
          venueNamePlaceholder={t('compVenueNamePlaceholder')}
          venueAddressLabel={t('compEditVenueAddress')}
          presentation="grouped"
        />
      </CompetitionFormSection>

      <CompetitionFormSection title={t('compFormSectionPubLink')}>
        <CompetitionFormInset>
          <View style={[competitionFormStyles.stackedFieldPadding, styles.glassesPad]}>
            <Muted style={competitionFormStyles.stackedLabel}>{t('compEditLinkedBarKey')}</Muted>
            <TextInput
              value={form.linkedBarKey}
              onChangeText={(linkedBarKey) => setForm({ ...form, linkedBarKey })}
              style={competitionFormStyles.groupedInput}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={brandColors.tanMuted}
            />
          </View>
        </CompetitionFormInset>
      </CompetitionFormSection>

      <View style={competitionFormStyles.footerActions}>
        {error ? (
          <Body style={styles.err} accessibilityRole="alert">
            {error}
          </Body>
        ) : null}
        <AppButton
          label={saveMut.isPending ? t('compEditSaving') : t('compEditSave')}
          disabled={saveMut.isPending}
          onPress={() => {
            setError(null);
            saveMut.mutate();
          }}
        />
        <AppButton label={t('compEditCancel')} variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { gap: 0 },
  glassesPad: { paddingBottom: 4 },
  dimmed: { opacity: 0.42 },
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
  err: {
    color: brandColors.red,
    fontWeight: '600',
    paddingHorizontal: 4,
    fontSize: 14,
    lineHeight: 20,
  },
});
