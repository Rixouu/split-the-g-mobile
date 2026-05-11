import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Muted } from '@/components/split-the-g/typography';
import { useLocale } from '@/lib/i18n/locale-context';
import { supabase } from '@/lib/supabase/client';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function ScoreRedirectScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const raw = useLocalSearchParams<{ splitId: string | string[] }>();
  const splitId = (typeof raw.splitId === 'string' ? raw.splitId : raw.splitId?.[0] ?? '').trim();
  const [message, setMessage] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!splitId || !UUID_RE.test(splitId)) {
      setMessage(t('scoreRedirectInvalid'));
      return;
    }
    const { data, error } = await supabase.from('scores').select('slug').eq('id', splitId).maybeSingle();
    if (error) {
      setMessage(error.message);
      return;
    }
    if (!data) {
      setMessage(t('scoreRedirectNotFound'));
      return;
    }
    const ref = typeof data.slug === 'string' && data.slug.trim() ? data.slug.trim() : splitId;
    router.replace(`/pour/${encodeURIComponent(ref)}`);
  }, [router, splitId, t]);

  useEffect(() => {
    void run();
  }, [run]);

  if (!message) {
    return (
      <Screen contentContainerStyle={{ flexGrow: 1 }}>
        <Card>
          <Body>{t('scoreRedirectOpening')}</Body>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={{ flexGrow: 1 }}>
      <Card>
        <Body>{t('scoreRedirectErrorTitle')}</Body>
        <Muted>{message}</Muted>
      </Card>
    </Screen>
  );
}
