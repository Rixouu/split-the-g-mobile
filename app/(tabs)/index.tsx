import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { trackEvent } from '@/lib/analytics/client';
import { useAuth } from '@/lib/auth/auth-context';
import { defaultLocale, translate } from '@/lib/i18n/translations';
import { submitPourImage } from '@/lib/pour/submit-pour';
import { mobilePathFromWebPath } from '@/lib/routing/paths';

export default function HomeScreen() {
  const { accessToken, user, signInWithGoogle, isConfigured } = useAuth();
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = (key: Parameters<typeof translate>[1]) => translate(defaultLocale, key);

  async function pickImage(source: 'camera' | 'library') {
    setMessage(null);
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setMessage('Camera or media permission is required to score a pour.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            base64: false,
            exif: true,
            quality: 0.86,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: false,
            base64: false,
            exif: true,
            quality: 0.86,
          });

    if (result.canceled) return;
    setSelectedImageUri(result.assets[0]?.uri ?? null);
    trackEvent('mobile_pour_image_selected', { source });
  }

  async function submitSelectedImage() {
    if (!selectedImageUri) return;
    setIsSubmitting(true);
    setMessage('Scoring your pour...');

    try {
      const result = await submitPourImage({
        imageUri: selectedImageUri,
        accessToken,
        actorName:
          user?.user_metadata?.full_name?.toString() ||
          user?.user_metadata?.name?.toString() ||
          user?.email?.split('@')[0],
      });

      if (!result.success) {
        setMessage(result.detail || result.error || 'Could not score this pour.');
        return;
      }

      trackEvent('mobile_pour_submitted', { scoreId: result.scoreId ?? null });
      if (result.redirectTo) router.push(mobilePathFromWebPath(result.redirectTo) as never);
      else if (result.scoreId) router.push(`/pour/${result.scoreId}` as never);
      else setMessage('Pour scored, but no result link was returned.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not submit this pour.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Eyebrow>Split The G mobile</Eyebrow>
        <Title>{t('homeTitle')}</Title>
        <Muted>{t('homeSubtitle')}</Muted>
      </View>

      {!isConfigured ? (
        <Card>
          <Body>Supabase env is not configured yet.</Body>
          <Muted>Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to continue.</Muted>
        </Card>
      ) : null}

      <Card>
        {selectedImageUri ? <Image source={{ uri: selectedImageUri }} style={styles.preview} /> : null}
        <View style={styles.actions}>
          <AppButton label={t('camera')} onPress={() => pickImage('camera')} />
          <AppButton
            label={t('library')}
            variant="secondary"
            onPress={() => pickImage('library')}
          />
          <AppButton
            label={isSubmitting ? 'Submitting...' : t('submitPour')}
            disabled={!selectedImageUri || isSubmitting}
            onPress={submitSelectedImage}
          />
        </View>
        {message ? <Muted>{message}</Muted> : null}
      </Card>

      {!user ? (
        <Card>
          <Body>Sign in to claim scores and sync your leaderboard name.</Body>
          <AppButton label={t('signInGoogle')} variant="secondary" onPress={signInWithGoogle} />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 10,
    paddingTop: 16,
  },
  preview: {
    width: '100%',
    height: 360,
    borderRadius: 24,
    backgroundColor: brandColors.panelMuted,
  },
  actions: {
    gap: 10,
  },
});
