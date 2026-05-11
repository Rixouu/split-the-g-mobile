import { useMutation, useQueryClient } from '@tanstack/react-query';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import type { PourScore } from '@/lib/api/types';
import { attachScoreToCompetition, updatePourVenue, type PourVenueUpdate } from '@/lib/api/client';
import { trackEvent } from '@/lib/analytics/client';
import { appConfig } from '@/lib/config';
import { useLocale } from '@/lib/i18n/locale-context';
import { translate } from '@/lib/i18n/translations';
import { fetchPlaceAutocomplete, fetchPlaceDetails, type PlaceAutocompleteItem } from '@/lib/places/google-places';
import {
  DEFAULT_PUB_GEOFENCE_MAX_METERS,
  haversineDistanceMeters,
} from '@/lib/utils/geo-distance';

interface PourVenueEditorProps {
  pourRef: string;
  score: PourScore;
  competitionId: string | null;
}

export function PourVenueEditor({ pourRef, score, competitionId }: PourVenueEditorProps) {
  const { locale } = useLocale();
  const qc = useQueryClient();

  const skipSuggestRef = useRef(false);
  const [barName, setBarName] = useState(score.bar_name?.trim() ?? '');
  const [barAddress, setBarAddress] = useState(score.bar_address?.trim() ?? '');
  const [googlePlaceId, setGooglePlaceId] = useState(score.google_place_id?.trim() || null);
  const [pourRating, setPourRating] = useState(
    score.pour_rating != null && Number.isFinite(Number(score.pour_rating))
      ? Number(score.pour_rating)
      : 2.5,
  );
  const [pintPriceStr, setPintPriceStr] = useState(
    score.pint_price != null && Number.isFinite(Number(score.pint_price)) ? String(score.pint_price) : '',
  );
  const [pickedPlace, setPickedPlace] = useState<{
    placeId: string;
    lat: number;
    lng: number;
    geo: {
      city: string | null;
      region: string | null;
      country: string | null;
      countryCode: string | null;
    };
  } | null>(null);

  const [suggestions, setSuggestions] = useState<PlaceAutocompleteItem[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attachMsg, setAttachMsg] = useState<string | null>(null);

  useEffect(() => {
    setBarName(score.bar_name?.trim() ?? '');
    setBarAddress(score.bar_address?.trim() ?? '');
    setGooglePlaceId(score.google_place_id?.trim() || null);
    setPickedPlace(null);
    setPourRating(
      score.pour_rating != null && Number.isFinite(Number(score.pour_rating))
        ? Number(score.pour_rating)
        : 2.5,
    );
    setPintPriceStr(
      score.pint_price != null && Number.isFinite(Number(score.pint_price)) ? String(score.pint_price) : '',
    );
    setSubmitError(null);
    setSuggestions([]);
    setAttachMsg(null);
    // Intentionally only when the score row changes — avoid fighting in-progress edits on refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score.id]);

  useEffect(() => {
    if (skipSuggestRef.current) {
      skipSuggestRef.current = false;
      return;
    }

    const key = appConfig.googleMapsApiKey?.trim();
    if (!key || barName.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const handle = setTimeout(() => {
      setSuggestLoading(true);
      void fetchPlaceAutocomplete(barName)
        .then(setSuggestions)
        .finally(() => setSuggestLoading(false));
    }, 280);

    return () => clearTimeout(handle);
  }, [barName]);

  const mutation = useMutation({
    mutationFn: async () => {
      setSubmitError(null);
      setAttachMsg(null);

      const nameTrim = barName.trim();
      if (!nameTrim) {
        throw new Error(translate(locale, 'errorBarNameRequired'));
      }

      if (!Number.isFinite(pourRating) || pourRating < 0 || pourRating > 5) {
        throw new Error(translate(locale, 'errorRatingRange'));
      }

      const pintTrim = pintPriceStr.trim();
      let pintPriceVal: number | null = null;
      if (pintTrim !== '') {
        const p = parseFloat(pintTrim);
        if (!Number.isFinite(p) || p < 0) {
          throw new Error(translate(locale, 'errorPintPriceBad'));
        }
        if (p > 999_999.99) {
          throw new Error(translate(locale, 'errorPintPriceLarge'));
        }
        pintPriceVal = Math.round(p * 100) / 100;
      }

      const geoSlice: Pick<
        PourVenueUpdate,
        'city' | 'region' | 'country' | 'country_code'
      > = {};
      if (pickedPlace) {
        const g = pickedPlace.geo;
        if (g.city) geoSlice.city = g.city;
        if (g.region) geoSlice.region = g.region;
        if (g.country) geoSlice.country = g.country;
        if (g.countryCode) geoSlice.country_code = g.countryCode;
      }

      const placeIdForSave = (pickedPlace?.placeId ?? googlePlaceId)?.trim() || null;
      const latLng =
        pickedPlace && Number.isFinite(pickedPlace.lat) && Number.isFinite(pickedPlace.lng)
          ? { lat: pickedPlace.lat, lng: pickedPlace.lng }
          : null;

      if (placeIdForSave && latLng) {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== Location.PermissionStatus.GRANTED) {
          throw new Error(translate(locale, 'errorGeofenceVenue'));
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const dM = haversineDistanceMeters(latLng, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });

        if (dM > DEFAULT_PUB_GEOFENCE_MAX_METERS) {
          throw new Error(translate(locale, 'errorGeofenceVenue'));
        }
      }

      await updatePourVenue(score.id, {
        bar_name: nameTrim,
        bar_address: barAddress.trim() || null,
        google_place_id: placeIdForSave,
        pour_rating: pourRating,
        pint_price: pintPriceVal,
        ...geoSlice,
      });

      if (competitionId) {
        try {
          await attachScoreToCompetition(competitionId, score.id);
          setAttachMsg(translate(locale, 'pourMsgAttachCompOk'));
          trackEvent('competition_attach_succeeded', {
            competitionId,
            scoreId: score.id,
          });
        } catch (err) {
          const reason = err instanceof Error ? err.message : 'unknown';
          setAttachMsg(translate(locale, 'pourMsgAttachCompFail'));
          trackEvent('competition_attach_failed', {
            competitionId,
            scoreId: score.id,
            reason,
          });
        }
      }

      trackEvent('venue_details_saved', {
        scoreId: score.id,
        hasPrice: pintPriceVal != null,
        hasPlaceId: Boolean(placeIdForSave),
      });
    },
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await qc.invalidateQueries({ queryKey: ['pourDetail', pourRef] });
      setPickedPlace(null);
    },
    onError: (err: Error) => {
      setSubmitError(err?.message || translate(locale, 'errorSaveVenue'));
    },
  });

  async function onPickSuggestion(item: PlaceAutocompleteItem) {
    skipSuggestRef.current = true;
    Keyboard.dismiss();
    setSuggestions([]);
    const details = await fetchPlaceDetails(item.placeId);
    if (details) {
      setPickedPlace({
        placeId: details.placeId,
        lat: details.lat,
        lng: details.lng,
        geo: {
          city: details.geo.city ?? null,
          region: details.geo.region ?? null,
          country: details.geo.country ?? null,
          countryCode: details.geo.countryCode ?? null,
        },
      });
      setBarName(details.name || item.mainText);
      setBarAddress(details.formattedAddress || item.secondaryText);
      setGooglePlaceId(details.placeId);
    } else {
      setBarName(item.mainText);
      setBarAddress(item.secondaryText);
      setGooglePlaceId(item.placeId);
    }
  }

  return (
    <View style={styles.card}>
      <Body style={styles.title}>{translate(locale, 'pourVenueTitle')}</Body>

      <Muted>{translate(locale, 'pourOwnerOnlyHint')}</Muted>

      <Muted style={styles.label}>{translate(locale, 'pourFieldBarName')}</Muted>
      <TextInput
        value={barName}
        onChangeText={(t) => {
          setBarName(t);
          setPickedPlace(null);
          setGooglePlaceId(null);
        }}
        placeholder="The Crown & Anchor"
        placeholderTextColor={brandColors.tanMuted}
        style={styles.input}
        autoCapitalize="words"
      />

      {suggestLoading ? (
        <ActivityIndicator color={brandColors.gold} style={{ alignSelf: 'flex-start' }} />
      ) : null}

      {suggestions.length > 0 ? (
        <View style={styles.suggestList}>
          {suggestions.map((item) => (
            <Pressable key={item.placeId} onPress={() => void onPickSuggestion(item)} style={styles.suggestRow}>
              <Body style={styles.suggestMain}>{item.mainText}</Body>
              {item.secondaryText ? <Muted>{item.secondaryText}</Muted> : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      <Muted style={styles.label}>{translate(locale, 'pourFieldBarAddress')}</Muted>
      <TextInput
        value={barAddress}
        onChangeText={setBarAddress}
        placeholder="123 High Street"
        placeholderTextColor={brandColors.tanMuted}
        style={styles.input}
      />

      <Muted style={styles.label}>{translate(locale, 'pourFieldRating')}</Muted>
      <Body style={styles.ratingValue}>{pourRating.toFixed(1)}</Body>
      <Slider
        minimumValue={0}
        maximumValue={5}
        step={0.05}
        value={pourRating}
        onValueChange={setPourRating}
        minimumTrackTintColor={brandColors.gold}
        maximumTrackTintColor={brandColors.frame}
        thumbTintColor={brandColors.goldBright}
      />

      <Muted style={styles.label}>{translate(locale, 'pourFieldPrice')}</Muted>
      <TextInput
        value={pintPriceStr}
        onChangeText={setPintPriceStr}
        placeholder="6.50"
        placeholderTextColor={brandColors.tanMuted}
        style={styles.input}
        keyboardType="decimal-pad"
      />

      {submitError ? <Body style={styles.err}>{submitError}</Body> : null}
      {attachMsg ? <Muted style={styles.attach}>{attachMsg}</Muted> : null}

      <AppButton
        label={mutation.isPending ? '…' : translate(locale, 'pourSaveVenue')}
        disabled={mutation.isPending}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    borderWidth: 1,
    borderColor: brandColors.frame,
    borderRadius: 14,
    backgroundColor: 'rgba(29, 24, 15, 0.35)',
    padding: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: brandColors.cream,
  },
  label: {
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: brandColors.cream,
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
  },
  ratingValue: {
    fontWeight: '700',
    color: brandColors.gold,
  },
  suggestList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    borderRadius: 10,
  },
  suggestRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.borderSubtle,
    gap: 4,
  },
  suggestMain: {
    fontSize: 15,
    fontWeight: '600',
  },
  err: {
    color: brandColors.red,
  },
  attach: {
    color: brandColors.goldBright,
  },
});
