import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { appConfig } from '@/lib/config';

const CREATE_URL = `${appConfig.siteUrl}/competitions/new`;

export default function CreateCompetitionScreen() {
  function openWebComposer() {
    void WebBrowser.openBrowserAsync(CREATE_URL);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Eyebrow>Competitions</Eyebrow>
        <Title>Create a competition</Title>
        <Muted>
          The full competition builder (rules, caps, venue link, invites) lives on the web app today. Open it in the
          in-app browser to create and manage events with the same Supabase session after you sign in on the site.
        </Muted>
      </View>

      <Card>
        <Body>We have not ported `competitions/new` and the edit flows to native UI yet—only listing and read-only detail.</Body>
        <AppButton label="Open competition builder on the web" onPress={openWebComposer} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
    paddingTop: 16,
  },
});
