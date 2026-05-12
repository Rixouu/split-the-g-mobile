/** Unicode regional-indicator flag from ISO 3166-1 alpha-2 (e.g. TH → 🇹🇭). Matches web `flagEmojiFromIso2`. */
export function flagEmojiFromIso2(code: string | null | undefined): string {
  if (!code || code.length !== 2) return '';
  const u = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(u)) return '';
  return String.fromCodePoint(...[...u].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0)));
}
