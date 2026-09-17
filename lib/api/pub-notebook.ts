import { supabase } from '@/lib/supabase/client';
import { type NotebookTag, type PubNote, type VisitStatus, validateNote } from '@/lib/pub/notebook';

export async function fetchPubNotes(userId: string): Promise<PubNote[]> {
  const { data, error } = await supabase.from('user_pub_notes')
    .select('favorite_id,user_id,status,notes,tags,updated_at').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as PubNote[];
}

export async function savePubNote(userId: string, favoriteId: string, input: { status: VisitStatus; notes: string; tags: NotebookTag[] }): Promise<PubNote> {
  const values = validateNote(input);
  const { data, error } = await supabase.from('user_pub_notes')
    .upsert({ ...values, favorite_id: favoriteId, user_id: userId }, { onConflict: 'favorite_id' })
    .select('favorite_id,user_id,status,notes,tags,updated_at').single();
  if (error) throw error;
  return data as PubNote;
}
