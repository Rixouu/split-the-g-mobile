import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NotebookPlaceCard } from '@/components/pub/notebook-place-card';
import { useNotebookData } from '@/components/pub/use-notebook-data';
import { AppButton } from '@/components/split-the-g/button';
import { DiscoverSectionTitle, DiscoverSegmentHeader } from '@/components/split-the-g/discover-feed-chrome';
import { Card, Screen } from '@/components/split-the-g/screen';
import { ListSkeleton, NotebookSkeleton } from '@/components/split-the-g/loading-skeleton';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { colors, radii, spacing } from '@/constants/design-tokens';
import { brandColors } from '@/constants/theme';
import { deleteFavoriteBar, favoriteMapsUrl, insertFavoriteBar } from '@/lib/api/profile';
import { savePubNote } from '@/lib/api/pub-notebook';
import { useAuth } from '@/lib/auth/auth-context';
import { addGuestPlace, removeGuestPlace, saveGuestNote } from '@/lib/pub/guest-notebook';
import {
  filterNotebook,
  notebookPlaces,
  NOTEBOOK_TAGS,
  NOTE_MAX_LENGTH,
  type NotebookPlace,
  type NotebookTag,
  type VisitStatus,
} from '@/lib/pub/notebook';
import { resolveFavoritePubRouteKeys } from '@/lib/pub/resolve-favorite-pub-route-keys';
import { updateNotebookCache } from '@/lib/pub/notebook-cache';

const STATUS_OPTIONS = [
  { value: 'want_to_visit' as const, label: 'Want to visit' },
  { value: 'visited' as const, label: 'Visited' },
];

function Chip({
  label,
  selected,
  onPress,
  disabled = false,
  compact = false,
  tab = false,
  count,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
  tab?: boolean;
  count?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityValue={count !== undefined ? { text: `${count} ${count === 1 ? 'place' : 'places'}` } : undefined}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        compact && styles.chipCompact,
        selected && styles.chipSelected,
        tab && styles.statusTab,
        tab && selected && styles.statusTabSelected,
        pressed && !disabled && styles.pressed,
      ]}>
      <Text numberOfLines={1} style={[styles.chipText, tab && styles.statusTabText, selected && styles.chipTextSelected]}>{label}</Text>
      {count !== undefined ? <Text style={styles.chipCount}>{count}</Text> : null}
    </Pressable>
  );
}

function SheetHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  onClose,
  disabled,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onClose: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.sheetHeader}>
      <View style={styles.sheetHandle} />
      <View style={styles.sheetTitleRow}>
        <View style={styles.sheetIcon}>
          <Ionicons name={icon} size={22} color={colors.text.accentBright} />
        </View>
        <View style={styles.sheetTitleWrap}>
          <Eyebrow style={styles.goldEyebrow}>{eyebrow}</Eyebrow>
          <Title style={styles.sheetTitle}>{title}</Title>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          disabled={disabled}
          hitSlop={8}
          onPress={onClose}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed, disabled && styles.disabled]}>
          <Ionicons name="close" size={21} color={colors.text.primary} />
        </Pressable>
      </View>
      <Muted style={styles.sheetSubtitle}>{subtitle}</Muted>
    </View>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function AddPlaceEditor({ userId, onClose }: { userId?: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const add = useMutation({
    networkMode: 'always',
    mutationFn: () => userId ? insertFavoriteBar(userId, name, address || null) : addGuestPlace(name, address || null),
    onSuccess: async (favorite) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await updateNotebookCache(qc, userId, { favorite });
      onClose();
      void qc.invalidateQueries({ queryKey: ['favorites', userId ?? 'guest'] });
      void qc.invalidateQueries({ queryKey: ['profileHub'] });
    },
  });

  const close = () => {
    if (add.isPending) return;
    if (!name && !address) return onClose();
    Alert.alert('Discard this place?', 'This place has not been saved yet.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: onClose },
    ]);
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView style={styles.modal}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.editor} keyboardShouldPersistTaps="handled">
            <SheetHeader
              eyebrow="ADD A PLACE"
              title="Save a discovery"
              subtitle="Keep a venue in your private Notebook, even when it is not yet in the pub directory."
              icon="add-circle-outline"
              onClose={close}
              disabled={add.isPending}
            />
            <View style={styles.formCard}>
              <FieldLabel>PLACE NAME</FieldLabel>
              <View style={styles.fieldShell}>
                <Ionicons name="business-outline" size={19} color={colors.text.accentBright} />
                <TextInput
                  accessibilityLabel="Place name"
                  placeholder="The Harp & Crown"
                  placeholderTextColor={brandColors.tanMuted}
                  value={name}
                  onChangeText={setName}
                  maxLength={160}
                  style={styles.fieldInput}
                  editable={!add.isPending}
                  returnKeyType="next"
                />
              </View>
              <FieldLabel>ADDRESS OR CITY</FieldLabel>
              <View style={styles.fieldShell}>
                <Ionicons name="location-outline" size={19} color={colors.text.accentBright} />
                <TextInput
                  accessibilityLabel="Address or city"
                  placeholder="Optional"
                  placeholderTextColor={brandColors.tanMuted}
                  value={address}
                  onChangeText={setAddress}
                  maxLength={500}
                  style={styles.fieldInput}
                  editable={!add.isPending}
                  returnKeyType="done"
                />
              </View>
            </View>
            <View style={styles.privateStrip}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.text.accentBright} />
              <Muted style={styles.privateText}>
                This place is saved to your Notebook only. It is never published to the community directory.
              </Muted>
            </View>
            {add.isError ? (
              <Body accessibilityRole="alert" style={styles.errorText}>
                Could not save this place. Check whether it is already saved, or try again.
              </Body>
            ) : null}
            <AppButton
              label={add.isPending ? 'Saving…' : 'Save to Notebook'}
              fullWidth
              disabled={!name.trim() || add.isPending}
              onPress={() => add.mutate()}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function NoteEditor({ place, userId, onClose }: { place: NotebookPlace; userId?: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<VisitStatus>(place.note?.status ?? 'want_to_visit');
  const [notes, setNotes] = useState(place.note?.notes ?? '');
  const [tags, setTags] = useState<NotebookTag[]>(place.note?.tags ?? []);
  const dirty = status !== (place.note?.status ?? 'want_to_visit')
    || notes !== (place.note?.notes ?? '')
    || JSON.stringify(tags) !== JSON.stringify(place.note?.tags ?? []);
  const save = useMutation({
    networkMode: 'always',
    mutationFn: () => userId
      ? savePubNote(userId, place.id, { status, notes, tags })
      : saveGuestNote(place.id, { status, notes, tags }),
    onSuccess: async (note) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await updateNotebookCache(qc, userId, { note });
      onClose();
      void qc.invalidateQueries({ queryKey: ['pub-notes', userId ?? 'guest'] });
    },
  });

  function close() {
    if (save.isPending) return;
    if (!dirty) return onClose();
    Alert.alert('Discard changes?', 'Your unsaved edits will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: onClose },
    ]);
  }

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView style={styles.modal}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.editor} keyboardShouldPersistTaps="handled">
            <SheetHeader
              eyebrow="PRIVATE NOTE"
              title={place.bar_name}
              subtitle={place.bar_address || 'Keep the details that will make your next visit easier.'}
              icon="book-outline"
              onClose={close}
              disabled={save.isPending}
            />

            <View style={styles.formCard}>
              <FieldLabel>YOUR LIST</FieldLabel>
              <View style={styles.chips}>
                {STATUS_OPTIONS.map((option) => (
                  <Chip
                    key={option.value}
                    disabled={save.isPending}
                    label={option.label}
                    selected={status === option.value}
                    onPress={() => setStatus(option.value)}
                  />
                ))}
              </View>
              <View style={styles.formDivider} />
              <FieldLabel>WHAT TO REMEMBER</FieldLabel>
              <View style={styles.chips}>
                {NOTEBOOK_TAGS.map((notebookTag) => (
                  <Chip
                    key={notebookTag}
                    compact
                    disabled={save.isPending}
                    label={notebookTag}
                    selected={tags.includes(notebookTag)}
                    onPress={() => setTags((current) => current.includes(notebookTag)
                      ? current.filter((item) => item !== notebookTag)
                      : [...current, notebookTag])}
                  />
                ))}
              </View>
              <Muted style={styles.helperText}>
                Tags are your observations, not verified amenities. Check with the venue before relying on access or menu details.
              </Muted>
            </View>

            <View style={styles.formCard}>
              <View style={styles.noteLabelRow}>
                <FieldLabel>YOUR NOTE</FieldLabel>
                <Text style={styles.counter}>{notes.length}/{NOTE_MAX_LENGTH}</Text>
              </View>
              <TextInput
                accessibilityLabel="Private venue notes"
                multiline
                value={notes}
                onChangeText={setNotes}
                maxLength={NOTE_MAX_LENGTH}
                style={styles.notesInput}
                placeholder="A quiet table upstairs, food to try, access details, or a reminder for next time…"
                placeholderTextColor={brandColors.tanMuted}
                textAlignVertical="top"
                editable={!save.isPending}
              />
              <View style={styles.inlinePrivacy}>
                <Ionicons name="lock-closed-outline" size={14} color={colors.text.muted} />
                <Muted style={styles.inlinePrivacyText}>
                  {userId ? 'Private to your account' : 'Saved on this device only'}
                </Muted>
              </View>
            </View>

            {save.isError ? (
              <Body accessibilityRole="alert" style={styles.errorText}>
                Could not save your note. Your edits are still here—check your connection and try again.
              </Body>
            ) : null}
            <AppButton
              label={save.isPending ? 'Saving…' : 'Save note'}
              fullWidth
              disabled={save.isPending}
              onPress={() => save.mutate()}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function EmptyNotebook({ onAdd, onDiscover }: { onAdd: () => void; onDiscover: () => void }) {
  return (
    <Card style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Ionicons name="book-outline" size={34} color={colors.text.accentBright} />
      </View>
      <Text style={styles.emptyTitle}>Your next great pub starts here.</Text>
      <Muted style={styles.emptyBody}>
        Save a pub from Discover or add your own place, then keep private notes for the next visit.
      </Muted>
      <AppButton label="Discover pubs" fullWidth onPress={onDiscover} />
      <AppButton label="Add your own place" fullWidth variant="secondary" onPress={onAdd} />
    </Card>
  );
}

export function PubNotebookScreen() {
  const { user } = useAuth();
  // Never carry an open editor or filters into another account.
  return <NotebookScreen key={user?.id ?? 'guest'} />;
}

function NotebookScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<VisitStatus | 'all'>('all');
  const [tag, setTag] = useState<NotebookTag | null>(null);
  const [showTags, setShowTags] = useState(false);
  const [editing, setEditing] = useState<NotebookPlace | null>(null);
  const [adding, setAdding] = useState(false);
  const { favorites, notes } = useNotebookData(user?.id, !authLoading);
  const routeKeys = useQuery({
    queryKey: ['favorite-pub-route-keys', user?.id, favorites.data?.map((row) => row.id).join('|') ?? ''],
    queryFn: () => resolveFavoritePubRouteKeys(favorites.data!),
    enabled: Boolean(favorites.data?.length),
    staleTime: 120_000,
  });
  const places = useMemo(() => notebookPlaces(favorites.data ?? [], notes.data ?? []), [favorites.data, notes.data]);
  const visible = useMemo(() => filterNotebook(places, search, status, tag), [places, search, status, tag]);
  const visitedCount = useMemo(() => places.filter((place) => place.note?.status === 'visited').length, [places]);
  const plannedCount = places.length - visitedCount;
  const hasFilters = Boolean(search.trim()) || status !== 'all' || tag != null;
  const loadError = favorites.isError && favorites.data === undefined;
  const loading = authLoading || (favorites.isPending && favorites.data === undefined);
  const notesLoading = notes.isPending && notes.data === undefined;
  const notesUnavailable = notes.data === undefined && notes.isError;
  const notesReady = !notesLoading && !notesUnavailable;
  const refresh = () => {
    void favorites.refetch();
    void notes.refetch();
    if (favorites.data?.length) void routeKeys.refetch();
  };
  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setTag(null);
  };
  const remove = useMutation({
    networkMode: 'always',
    mutationFn: (id: string) => user ? deleteFavoriteBar(id) : removeGuestPlace(id),
    onSuccess: async (_result, removedId) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await updateNotebookCache(qc, user?.id, { removedId });
      void qc.invalidateQueries({ queryKey: ['favorites', user?.id ?? 'guest'] });
      void qc.invalidateQueries({ queryKey: ['pub-notes', user?.id ?? 'guest'] });
      void qc.invalidateQueries({ queryKey: ['pub-detail'] });
      void qc.invalidateQueries({ queryKey: ['profileHub'] });
    },
    onError: () => Alert.alert('Could not remove place', 'Please try again. Your saved place has not been removed.'),
  });

  function removePlace(place: NotebookPlace) {
    Alert.alert('Remove saved place?', `Remove ${place.bar_name} and its private note? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(place.id) },
    ]);
  }

  async function openMap(place: NotebookPlace) {
    try {
      await Linking.openURL(favoriteMapsUrl(place));
    } catch {
      Alert.alert('Map unavailable', 'Please try again, or search for the venue in your maps app.');
    }
  }

  return (
    <>
      <Screen
        accessibilityElementsHidden={Boolean(editing || adding)}
        importantForAccessibility={editing || adding ? 'no-hide-descendants' : 'auto'}
        contentContainerStyle={styles.screenContent}
        refreshControl={(
          <RefreshControl
            refreshing={favorites.isRefetching || notes.isRefetching}
            onRefresh={refresh}
            tintColor={brandColors.gold}
          />
        )}>
        <DiscoverSegmentHeader
          eyebrow="YOUR COLLECTION"
          title="Notebook"
          subtitle="Saved places and personal notes."
          style={styles.notebookHeader}
          titleTrailing={(
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add a place"
              hitSlop={8}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAdding(true);
              }}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
              <Ionicons name="add" size={18} color={colors.text.accentBright} />
              <Text style={styles.addLabel}>Add place</Text>
            </Pressable>
          )}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="About your private Notebook"
            onPress={() => Alert.alert(
              user ? 'Private & synced' : 'Private on this device',
              user
                ? 'Your notes stay private to your account and follow you between devices.'
                : 'No login needed. Guest notes stay on this phone and are removed if the app is uninstalled. Signing in opens a separate account Notebook.',
            )}
            style={styles.privacyBanner}>
            <Ionicons name="lock-closed-outline" size={12} color={colors.text.secondary} />
            <Text style={styles.privacyTitle}>{user ? 'Private to your account' : 'Private on this device'}</Text>
            <Ionicons name="information-circle-outline" size={14} color={colors.text.secondary} />
          </Pressable>
        </DiscoverSegmentHeader>

        {loading ? (
          <NotebookSkeleton />
        ) : loadError ? (
          <Card style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <Ionicons name="cloud-offline-outline" size={27} color={colors.text.accentBright} />
            </View>
            <Body accessibilityRole="alert" style={styles.errorTitle}>Your Notebook could not be loaded.</Body>
            <Muted style={styles.emptyBody}>
              {user
                ? 'Check your connection and try again. Your saved notes have not been changed.'
                : 'Device storage could not be read. Try again without uninstalling the app.'}
            </Muted>
            <AppButton label="Try again" fullWidth variant="secondary" onPress={refresh} />
          </Card>
        ) : (
          <>
            {favorites.isError || notes.isError ? (
              <Card>
                <Body accessibilityRole="alert">Some Notebook information could not be refreshed.</Body>
                <Muted>Your saved places are still available. Try again to load the latest notes.</Muted>
                <AppButton label="Try again" variant="secondary" onPress={refresh} />
              </Card>
            ) : null}

            {places.length === 0 ? (
              <EmptyNotebook onAdd={() => setAdding(true)} onDiscover={() => router.push('/pubs')} />
            ) : (
              <>
                <View style={styles.filterCard}>
                  <View style={styles.searchRow}>
                    <View style={styles.searchShell}>
                      <Ionicons name="search" size={19} color={colors.text.mutedStrong} />
                      <TextInput
                        accessibilityLabel="Search saved places and notes"
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search places, notes, or tags"
                        placeholderTextColor={colors.text.secondary}
                        style={styles.searchInput}
                        autoCorrect={false}
                        returnKeyType="search"
                      />
                      {search ? (
                        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={() => setSearch('')}>
                          <Ionicons name="close-circle" size={19} color={colors.text.mutedStrong} />
                        </Pressable>
                      ) : null}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Filter by tag"
                        accessibilityState={{ expanded: showTags }}
                        onPress={() => setShowTags((value) => !value)}
                        style={styles.filterButton}>
                        <Ionicons name="options-outline" size={20} color={showTags || tag ? colors.text.accentBright : colors.text.secondary} />
                        {tag ? <View style={styles.filterDot} /> : null}
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.statusTabs}>
                    <Chip label="All" tab count={places.length} disabled={!notesReady} selected={status === 'all'} onPress={() => setStatus('all')} />
                    {STATUS_OPTIONS.map((option) => (
                      <Chip
                        key={option.value}
                        label={option.value === 'want_to_visit' ? 'To visit' : option.label}
                        tab
                        count={notesReady ? option.value === 'visited' ? visitedCount : plannedCount : undefined}
                        disabled={!notesReady}
                        selected={status === option.value}
                        onPress={() => setStatus(option.value)}
                      />
                    ))}
                  </View>
                  {showTags ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.tagList}>
                      <Chip label="Any tag" compact disabled={!notesReady} selected={!tag} onPress={() => setTag(null)} />
                    {NOTEBOOK_TAGS.map((notebookTag) => (
                      <Chip
                        key={notebookTag}
                        compact
                        label={notebookTag}
                        disabled={!notesReady}
                        selected={tag === notebookTag}
                        onPress={() => setTag(notebookTag)}
                      />
                    ))}
                    </ScrollView>
                  ) : tag ? (
                    <Pressable accessibilityRole="button" accessibilityLabel="Clear tag filter" onPress={() => setTag(null)} style={styles.activeTag}>
                      <Text style={styles.chipTextSelected}>{tag}</Text>
                      <Ionicons name="close" size={15} color={colors.text.accentBright} />
                    </Pressable>
                  ) : null}
                </View>

                <View style={styles.listHeading}>
                  <DiscoverSectionTitle style={styles.listTitle}>
                    {visible.length} {visible.length === 1 ? 'PLACE' : 'PLACES'}
                  </DiscoverSectionTitle>
                  {hasFilters ? (
                    <Pressable accessibilityRole="button" onPress={clearFilters} hitSlop={8}>
                      <Text style={styles.clearLabel}>Clear filters</Text>
                    </Pressable>
                  ) : null}
                </View>

                {visible.length === 0 && notesLoading ? (
                  <ListSkeleton count={1} label="Loading private notes for your search…" />
                ) : visible.length === 0 ? (
                  <Card style={styles.noResultsCard}>
                    <View style={styles.noResultsIcon}>
                      <Ionicons name="search-outline" size={26} color={colors.text.accentBright} />
                    </View>
                    <Text style={styles.noResultsTitle}>Nothing in this part of your Notebook.</Text>
                    <Muted style={styles.emptyBody}>Try another search, status, or tag.</Muted>
                    <AppButton label="Clear filters" variant="secondary" onPress={clearFilters} />
                  </Card>
                ) : (
                  <View style={styles.cards}>
                    {visible.map((place) => {
                      const pubKey = routeKeys.data?.[place.id];
                      return (
                        <NotebookPlaceCard
                          key={place.id}
                          place={place}
                          pubKey={pubKey}
                          notesLoading={notesLoading}
                          notesUnavailable={notesUnavailable}
                          removing={remove.isPending}
                          onOpenPub={() => {
                            if (pubKey) router.push(`/pub/${encodeURIComponent(pubKey)}` as never);
                          }}
                          onEdit={() => setEditing(place)}
                          onDirections={() => void openMap(place)}
                          onRemove={() => removePlace(place)}
                        />
                      );
                    })}
                  </View>
                )}
              </>
            )}
          </>
        )}
      </Screen>
      {editing ? (
        <NoteEditor
          key={`${user?.id ?? 'guest'}:${editing.id}`}
          place={editing}
          userId={user?.id}
          onClose={() => setEditing(null)}
        />
      ) : null}
      {adding ? <AddPlaceEditor userId={user?.id} onClose={() => setAdding(false)} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.4 },
  screenContent: { paddingTop: spacing.sm, gap: spacing.xl },
  notebookHeader: { marginBottom: 0 },
  goldEyebrow: { color: colors.text.accentBright, opacity: 0.9 },
  addButton: { minHeight: 44, flexDirection: 'row', gap: 5, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.stroke.default, borderRadius: radii.buttonRounded },
  addLabel: { color: colors.text.accentBright, fontSize: 12, fontWeight: '700' },
  privacyBanner: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 30 },
  privacyTitle: { color: colors.text.secondary, fontSize: 11, lineHeight: 16 },
  emptyCard: { alignItems: 'center', paddingVertical: 26 },
  emptyIcon: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.stroke.outlineStrong,
    borderRadius: 23,
    backgroundColor: colors.surface.hubIconWell,
  },
  emptyTitle: { color: colors.text.primary, fontSize: 21, fontWeight: '800', textAlign: 'center' },
  emptyBody: { textAlign: 'center' },
  errorCard: { alignItems: 'center' },
  errorIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.surface.hubIconWell,
  },
  errorTitle: { fontWeight: '800', textAlign: 'center' },
  errorText: { color: brandColors.red, fontSize: 14 },
  filterCard: { gap: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  searchShell: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: colors.stroke.frame, borderRadius: radii.md, backgroundColor: colors.surface.card, paddingLeft: 13, paddingRight: 4 },
  searchInput: { flex: 1, minWidth: 0, color: colors.text.primary, fontSize: 14, paddingVertical: 11 },
  filterButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  filterDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.text.accentBright, position: 'absolute', top: 9, right: 9 },
  statusTabs: { flexDirection: 'row', gap: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.stroke.subtle },
  tagList: { gap: 7 },
  activeTag: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  statusTab: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, borderWidth: 0, borderBottomWidth: 2, borderBottomColor: 'transparent', borderRadius: 0, backgroundColor: 'transparent', paddingHorizontal: 0 },
  statusTabSelected: { borderBottomColor: colors.text.accent },
  statusTabText: { textTransform: 'uppercase', letterSpacing: 0.65, color: colors.text.secondary },
  chipCount: { color: colors.text.secondary, fontSize: 11, fontWeight: '500' },
  chip: {
    minHeight: 42,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.stroke.frame,
    borderRadius: radii.pill,
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipCompact: { minHeight: 40, paddingHorizontal: 8, paddingVertical: 7 },
  chipSelected: { borderColor: colors.stroke.ctaSecondary, backgroundColor: colors.surface.favOnTint },
  chipText: { color: colors.text.muted, fontSize: 12, fontWeight: '700' },
  chipTextSelected: { color: colors.text.accentBright, fontWeight: '700' },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  listTitle: { marginBottom: 0, fontSize: 11, letterSpacing: 1.1, color: colors.text.secondary, fontWeight: '600' },
  clearLabel: { color: colors.text.accentBright, fontSize: 12, fontWeight: '800' },
  cards: { gap: 14 },
  noResultsCard: { alignItems: 'center' },
  noResultsIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: colors.surface.hubIconWell,
  },
  noResultsTitle: { color: colors.text.primary, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  modal: { flex: 1, backgroundColor: brandColors.black },
  editor: { paddingHorizontal: spacing.screenGutter, paddingTop: 6, gap: 18, paddingBottom: 40 },
  sheetHeader: { gap: 12, paddingBottom: 3 },
  sheetHandle: {
    width: 38,
    height: 5,
    alignSelf: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.stroke.outlineStrong,
    marginBottom: 5,
  },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetIcon: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.stroke.outlineStrong,
    borderRadius: 14,
    backgroundColor: colors.surface.hubIconWell,
  },
  sheetTitleWrap: { flex: 1, minWidth: 0, gap: 4 },
  sheetTitle: { fontSize: 24, lineHeight: 29 },
  sheetSubtitle: { lineHeight: 20 },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    gap: 12,
    borderWidth: 1,
    borderColor: colors.stroke.hub,
    borderRadius: radii.card,
    backgroundColor: colors.surface.card,
    padding: spacing.cardPadding,
  },
  fieldLabel: { color: colors.text.accentBright, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  fieldShell: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: 1,
    borderColor: colors.stroke.frame,
    borderRadius: 13,
    backgroundColor: colors.surface.inkTranslucent,
    paddingHorizontal: 14,
  },
  fieldInput: { flex: 1, color: colors.text.primary, fontSize: 16, paddingVertical: 12 },
  privateStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.stroke.subtle,
    borderRadius: radii.card,
    backgroundColor: colors.surface.panelTranslucentSoft,
    padding: 14,
  },
  privateText: { flex: 1, fontSize: 12, lineHeight: 18 },
  formDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.stroke.subtle, marginVertical: 2 },
  helperText: { fontSize: 12, lineHeight: 18 },
  noteLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  counter: { color: colors.text.muted, fontSize: 11, fontWeight: '700' },
  notesInput: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: colors.stroke.frame,
    borderRadius: 13,
    backgroundColor: colors.surface.inkTranslucent,
    padding: 14,
    color: colors.text.primary,
    fontSize: 15,
    lineHeight: 22,
  },
  inlinePrivacy: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inlinePrivacyText: { fontSize: 11 },
});
