import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CompetitionDateTimeRangeField } from '@/components/competition/competition-datetime-range-field';
import {
  CompetitionLocationField,
  type CompetitionLocationValue,
} from '@/components/competition/competition-location-field';
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
          onPress={() => form && setForm({ ...form, winRule: r })}
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
    <Screen edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
      <Card>
        <Muted>{t('compEditFieldName')}</Muted>
        <TextInput
          value={form.title}
          onChangeText={(title) => setForm({ ...form, title })}
          style={styles.input}
          placeholderTextColor={brandColors.tanMuted}
        />
        <Muted>{t('compEditFieldMaxParticipants')}</Muted>
        <TextInput
          value={form.maxParticipants}
          onChangeText={(maxParticipants) => setForm({ ...form, maxParticipants })}
          style={styles.input}
          keyboardType="number-pad"
          placeholderTextColor={brandColors.tanMuted}
        />
        <Muted>{t('compEditFieldGlasses')}</Muted>
        <TextInput
          value={form.glassesPerPerson}
          onChangeText={(glassesPerPerson) => setForm({ ...form, glassesPerPerson })}
          style={styles.input}
          keyboardType="number-pad"
          placeholderTextColor={brandColors.tanMuted}
        />
        <Muted>{t('compEditFieldWinRule')}</Muted>
        <View style={styles.ruleRow}>{winRuleSelectors}</View>
        {form.winRule === 'closest_to_target' ? (
          <>
            <Muted>{t('compEditFieldTarget')}</Muted>
            <TextInput
              value={form.targetScore}
              onChangeText={(targetScore) => setForm({ ...form, targetScore })}
              style={styles.input}
              keyboardType="decimal-pad"
              placeholderTextColor={brandColors.tanMuted}
            />
          </>
        ) : null}
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
        />
        <Pressable
          onPress={() => setForm({ ...form, isPublic: !form.isPublic })}
          style={styles.toggle}
          accessibilityRole="button">
          <Body>{form.isPublic ? t('compEditPublic') : t('compEditPrivate')}</Body>
        </Pressable>
        <CompetitionLocationField
          value={form.location}
          onChange={(location) => setForm({ ...form, location })}
          venueNameLabel={t('compEditVenueName')}
          venueNamePlaceholder={t('compVenueNamePlaceholder')}
          venueAddressLabel={t('compEditVenueAddress')}
        />
        <Muted>{t('compEditLinkedBarKey')}</Muted>
        <TextInput
          value={form.linkedBarKey}
          onChangeText={(linkedBarKey) => setForm({ ...form, linkedBarKey })}
          style={styles.input}
          autoCapitalize="none"
          placeholderTextColor={brandColors.tanMuted}
        />
        {error ? <Body style={styles.err}>{error}</Body> : null}
        <AppButton
          label={saveMut.isPending ? t('compEditSaving') : t('compEditSave')}
          disabled={saveMut.isPending}
          onPress={() => {
            setError(null);
            saveMut.mutate();
          }}
        />
        <AppButton label={t('compEditCancel')} variant="secondary" onPress={() => router.back()} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    borderRadius: 10,
    padding: 12,
    color: brandColors.cream,
    marginBottom: 12,
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
  },
  ruleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
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
  ruleChipText: {
    fontSize: 13,
    color: brandColors.muted,
  },
  ruleChipTextOn: {
    color: brandColors.goldBright,
    fontWeight: '700',
  },
  toggle: {
    paddingVertical: 12,
    marginBottom: 12,
  },
  err: {
    color: brandColors.red,
    marginBottom: 8,
  },
});
