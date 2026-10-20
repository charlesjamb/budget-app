const utf8 = new TextDecoder("utf-8", { fatal: true });
// The "latin1" label resolves to windows-1252 in the WHATWG spec, which also covers € and curly quotes.
const latin1 = new TextDecoder("latin1");

/** Decodes an uploaded bank CSV: UTF-8 when valid, otherwise latin1 (what the bank exports). */
export function decodeCsv(buffer: Buffer): string {
  try {
    return utf8.decode(buffer);
  } catch {
    return latin1.decode(buffer);
  }
}
