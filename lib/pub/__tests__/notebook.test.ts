import { filterNotebook, notebookPlaces, validateNote, type PubNote } from '../notebook';

const favorites = [
  { id: 'a', bar_name: 'Garden Pub', bar_address: 'Bangkok', created_at: '2026-09-17' },
  { id: 'b', bar_name: 'Corner House', bar_address: 'London', created_at: '2026-09-16' },
];
const note: PubNote = { favorite_id: 'a', user_id: 'u', status: 'visited', notes: 'Quiet upstairs table', tags: ['Food', 'Quiet'], updated_at: '2026-09-17' };

describe('Pub Notebook', () => {
  const places = notebookPlaces(favorites, [note]);
  it('preserves existing favorites and defaults unannotated places to want-to-visit', () => {
    expect(places).toHaveLength(2);
    expect(filterNotebook(places, '', 'want_to_visit', null).map((row) => row.id)).toEqual(['b']);
  });
  it('combines name, address, note, tag and status filters', () => {
    expect(filterNotebook(places, 'BANGKOK upstairs', 'visited', 'Food').map((row) => row.id)).toEqual(['a']);
    expect(filterNotebook(places, 'upstairs', 'want_to_visit', null)).toEqual([]);
    expect(filterNotebook(places, '', 'all', 'Live music')).toEqual([]);
  });
  it('does not rank or count drinks and preserves saved-place order', () => {
    expect(filterNotebook(places, ' ', 'all', null).map((row) => row.id)).toEqual(['a', 'b']);
  });
  it('trims notes, deduplicates tags and rejects invalid values', () => {
    expect(validateNote({ status: 'visited', notes: ' hello ', tags: ['Food', 'Food'] })).toEqual({ status: 'visited', notes: 'hello', tags: ['Food'] });
    expect(() => validateNote({ status: 'visited', notes: 'x'.repeat(2001), tags: [] })).toThrow();
    expect(() => validateNote({ status: 'invalid' as never, notes: '', tags: [] })).toThrow();
    expect(() => validateNote({ status: 'visited', notes: '', tags: ['invented' as never] })).toThrow();
  });
});
