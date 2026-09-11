import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Muted } from '@/components/split-the-g/typography';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';

interface AuthSignInButtonsProps {
  disabled?: boolean;
  onError?: (error: Error) => void;
}

export function AuthSignInButtons({ disabled = false, onError }: AuthSignInButtonsProps) {
  const { isLoading, signInWithApple, signInWithGoogle } = useAuth();
  const { t } = useLocale();
  const [activeProvider, setActiveProvider] = useState<'apple' | 'google' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const busy = disabled || isLoading || activeProvider !== null;

  async function run(provider: 'apple' | 'google') {
    if (busy) return;
    setActiveProvider(provider);
    setErrorMessage(null);
    try {
      await (provider === 'apple' ? signInWithApple() : signInWithGoogle());
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error(t('signInError'));
      setErrorMessage(t('signInError'));
      onError?.(normalized);
    } finally {
      setActiveProvider(null);
    }
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <View pointerEvents={busy ? 'none' : 'auto'} style={busy ? styles.disabled : null}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={24}
            onPress={() => void run('apple')}
            style={styles.appleButton}
          />
        </View>
      ) : null}
      <AppButton
        label={activeProvider === 'google' ? '…' : t('signInGoogle')}
        fullWidth
        disabled={busy}
        onPress={() => void run('google')}
      />
      {errorMessage && !onError ? <Muted style={styles.error}>{errorMessage}</Muted> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    gap: 12,
  },
  appleButton: {
    width: '100%',
    height: 50,
  },
  disabled: {
    opacity: 0.5,
  },
  error: {
    textAlign: 'center',
  },
});
