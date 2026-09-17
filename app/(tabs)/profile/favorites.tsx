import { Redirect } from 'expo-router';

// Keep old links working without maintaining a second saved-places menu.
export default function ProfileFavoritesScreen() {
  return <Redirect href="/journal" />;
}
