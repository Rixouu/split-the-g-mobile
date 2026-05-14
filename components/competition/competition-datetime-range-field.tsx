import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import {
  CompetitionFormHairline,
  CompetitionFormInset,
  competitionFormStyles,
} from '@/components/competition/competition-form-layout';
import { AppButton } from '@/components/split-the-g/button';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import {
  dateToDatetimeLocalValue,
  formatCompetitionDatetimeButtonLabel,
  parseDatetimeLocalToDate,
} from '@/lib/competition/datetime-local';

type PickerTarget = 'start' | 'end';

interface CompetitionDateTimeRangeFieldProps {
  startsAt: string;
  endsAt: string;
  onChangeStartsAt: (next: string) => void;
  onChangeEndsAt: (next: string) => void;
  labelStart: string;
  labelEnd: string;
  pickStartTitle: string;
  pickEndTitle: string;
  doneLabel: string;
  cancelLabel: string;
  emptyValueLabel: string;
  /** `grouped` = inset list rows; `classic` = legacy bordered fields. */
  presentation?: 'grouped' | 'classic';
}

export function CompetitionDateTimeRangeField({
  startsAt,
  endsAt,
  onChangeStartsAt,
  onChangeEndsAt,
  cancelLabel,
  doneLabel,
  emptyValueLabel,
  pickEndTitle,
  pickStartTitle,
  labelEnd,
  labelStart,
  presentation = 'grouped',
}: CompetitionDateTimeRangeFieldProps) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<PickerTarget>('start');
  const [androidStep, setAndroidStep] = useState<'date' | 'time'>('date');

  const initialForTarget = useCallback(
    (t: PickerTarget): Date => {
      const raw = t === 'start' ? startsAt : endsAt;
      return parseDatetimeLocalToDate(raw) ?? new Date();
    },
    [endsAt, startsAt],
  );

  const [draft, setDraft] = useState<Date>(() => initialForTarget('start'));

  const openFor = useCallback(
    (t: PickerTarget) => {
      setTarget(t);
      setDraft(initialForTarget(t));
      setAndroidStep('date');
      setOpen(true);
    },
    [initialForTarget],
  );

  const applyDraft = useCallback(() => {
    const next = dateToDatetimeLocalValue(draft);
    if (target === 'start') onChangeStartsAt(next);
    else onChangeEndsAt(next);
    setOpen(false);
  }, [draft, onChangeEndsAt, onChangeStartsAt, target]);

  const onIosChange = useCallback((_e: DateTimePickerEvent, date?: Date) => {
    if (date) setDraft(date);
  }, []);

  const onAndroidChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (event.type === 'dismissed') {
        setOpen(false);
        setAndroidStep('date');
        return;
      }
      if (!date) return;
      if (androidStep === 'date') {
        setDraft((prev) => {
          const next = new Date(prev);
          next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
          return next;
        });
        setAndroidStep('time');
        return;
      }
      setDraft((prev) => {
        const next = new Date(prev);
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
        const nextVal = dateToDatetimeLocalValue(next);
        if (target === 'start') onChangeStartsAt(nextVal);
        else onChangeEndsAt(nextVal);
        return next;
      });
      setOpen(false);
      setAndroidStep('date');
    },
    [androidStep, onChangeEndsAt, onChangeStartsAt, target],
  );

  const modalTitle = target === 'start' ? pickStartTitle : pickEndTitle;

  const androidMode = androidStep === 'date' ? 'date' : 'time';

  const iosPicker = useMemo(
    () => (
      <DateTimePicker value={draft} mode="datetime" display="spinner" onChange={onIosChange} themeVariant="dark" />
    ),
    [draft, onIosChange],
  );

  const androidPicker =
    open && Platform.OS === 'android' ? (
      <DateTimePicker value={draft} mode={androidMode} display="default" onChange={onAndroidChange} themeVariant="dark" />
    ) : null;

  const startDisplay = startsAt.trim() ? formatCompetitionDatetimeButtonLabel(startsAt) : emptyValueLabel;
  const endDisplay = endsAt.trim() ? formatCompetitionDatetimeButtonLabel(endsAt) : emptyValueLabel;

  const pickerShell = (
    <>
      {Platform.OS === 'ios' ? (
        <Modal visible={open} animationType="slide" transparent>
          <View style={styles.backdrop}>
            <View style={styles.sheet}>
              <Body style={styles.sheetTitle}>{modalTitle}</Body>
              {iosPicker}
              <View style={styles.sheetActions}>
                <AppButton label={doneLabel} onPress={applyDraft} />
                <AppButton label={cancelLabel} variant="secondary" onPress={() => setOpen(false)} />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
      {androidPicker}
    </>
  );

  if (presentation === 'grouped') {
    return (
      <View style={styles.groupedWrap}>
        <CompetitionFormInset>
          <Pressable
            android_ripple={{ color: 'rgba(197, 160, 89, 0.12)' }}
            onPress={() => openFor('start')}
            style={({ pressed }) => [competitionFormStyles.pickerRow, pressed && styles.pressedRow]}
            accessibilityRole="button"
            accessibilityLabel={labelStart}>
            <View style={competitionFormStyles.pickerTexts}>
              <Muted style={styles.pickerLabel}>{labelStart}</Muted>
              <Body style={styles.pickerValue}>{startDisplay}</Body>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="rgba(197, 160, 89, 0.45)"
              style={competitionFormStyles.pickerChevronWrap}
            />
          </Pressable>
          <CompetitionFormHairline />
          <Pressable
            android_ripple={{ color: 'rgba(197, 160, 89, 0.12)' }}
            onPress={() => openFor('end')}
            style={({ pressed }) => [competitionFormStyles.pickerRow, pressed && styles.pressedRow]}
            accessibilityRole="button"
            accessibilityLabel={labelEnd}>
            <View style={competitionFormStyles.pickerTexts}>
              <Muted style={styles.pickerLabel}>{labelEnd}</Muted>
              <Body style={styles.pickerValue}>{endDisplay}</Body>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="rgba(197, 160, 89, 0.45)"
              style={competitionFormStyles.pickerChevronWrap}
            />
          </Pressable>
        </CompetitionFormInset>
        {pickerShell}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Muted>{labelStart}</Muted>
      <Pressable onPress={() => openFor('start')} style={styles.field} accessibilityRole="button">
        <Body style={styles.fieldText}>{startDisplay}</Body>
      </Pressable>
      <Muted>{labelEnd}</Muted>
      <Pressable onPress={() => openFor('end')} style={styles.field} accessibilityRole="button">
        <Body style={styles.fieldText}>{endDisplay}</Body>
      </Pressable>
      {pickerShell}
    </View>
  );
}

const styles = StyleSheet.create({
  groupedWrap: { marginBottom: 2 },
  pressedRow: {
    backgroundColor: 'rgba(29, 24, 15, 0.55)',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.35,
  },
  pickerValue: {
    fontWeight: '600',
    fontSize: 16,
    color: brandColors.cream,
  },
  wrap: { gap: 6, marginBottom: 4 },
  field: {
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
  },
  fieldText: { color: brandColors.cream, fontWeight: '600' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: brandColors.black,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: brandColors.frame,
    gap: 12,
  },
  sheetTitle: { fontWeight: '700', fontSize: 17, marginBottom: 4 },
  sheetActions: { gap: 10, marginTop: 8 },
});
