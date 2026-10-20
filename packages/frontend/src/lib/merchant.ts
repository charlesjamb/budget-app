/** "LES TILLEULS" → "Les Tilleuls"; keeps short all-caps tokens with digits (e.g. "SNCF 75") readable. */
export function toTitleCase(label: string): string {
  return label
    .toLowerCase()
    .replace(
      /(^|[\s\-/'’(])(\p{L})/gu,
      (_, sep: string, letter: string) => sep + letter.toUpperCase(),
    )
    .trim();
}
