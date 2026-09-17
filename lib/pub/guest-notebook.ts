import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import type { FavoriteRow } from '@/lib/api/profile';
import { type PubNote, type NotebookTag, type VisitStatus, validateNote } from './notebook';

const STORAGE_KEY = 'split-the-g-guest-notebook-v1';
interface GuestNotebook { favorites: FavoriteRow[]; notes: PubNote[] }
let pendingWrite: Promise<unknown> = Promise.resolve();

export async function readGuestNotebook(): Promise<GuestNotebook> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return { favorites: [], notes: [] };
  const value = JSON.parse(raw) as GuestNotebook;
  // Fail closed rather than silently overwrite a damaged notebook.
  if (!value || !Array.isArray(value.favorites) || !Array.isArray(value.notes) ||
    value.favorites.some((place) => !place || typeof place.id !== 'string' || typeof place.bar_name !== 'string') ||
    value.notes.some((note) => !note || typeof note.favorite_id !== 'string' || typeof note.notes !== 'string' || !Array.isArray(note.tags) || note.tags.some((tag) => typeof tag !== 'string'))) {
    throw new Error('Notebook storage is unreadable.');
  }
  return value;
}

function editGuestNotebook<T>(edit: (data: GuestNotebook) => T): Promise<T> {
  const next = pendingWrite.catch(() => {}).then(async () => {
    const data = await readGuestNotebook();
    const result = edit(data);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return result;
  });
  pendingWrite = next;
  return next;
}

export function addGuestPlace(name: string, address: string | null): Promise<void> {
  return editGuestNotebook((data) => {
    if (!name.trim() || name.trim().length > 160 || (address?.trim().length ?? 0) > 500) throw new Error('Enter a place name and a shorter address.');
    if (data.favorites.some((row) => row.bar_name.trim().toLowerCase() === name.trim().toLowerCase() && (row.bar_address ?? '').trim() === (address ?? '').trim())) return;
    data.favorites.unshift({ id: Crypto.randomUUID(), bar_name: name.trim(), bar_address: address?.trim() || null, created_at: new Date().toISOString() });
  });
}

export function removeGuestPlace(id: string): Promise<void> {
  return editGuestNotebook((data) => {
    data.favorites = data.favorites.filter((row) => row.id !== id);
    data.notes = data.notes.filter((row) => row.favorite_id !== id);
  });
}

export function saveGuestNote(id: string, input: { status: VisitStatus; notes: string; tags: NotebookTag[] }): Promise<PubNote> {
  const values = validateNote(input);
  return editGuestNotebook((data) => {
    if (!data.favorites.some((row) => row.id === id)) throw new Error('This place is no longer in your notebook.');
    const note: PubNote = { ...values, favorite_id: id, user_id: 'guest', updated_at: new Date().toISOString() };
    data.notes = [...data.notes.filter((row) => row.favorite_id !== id), note];
    return note;
  });
}
