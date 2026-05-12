import { Redirect } from 'expo-router';

/** Legacy path from home / leaderboard CTAs — merged into Feed → Wall segment. */
export default function WallRedirect() {
  return <Redirect href="/feed?tab=wall" />;
}
