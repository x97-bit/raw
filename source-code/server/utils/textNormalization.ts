/**
 * Normalizes Arabic text to prevent duplicate entries caused by minor spelling differences.
 * 
 * Rules applied:
 * 1. Trims leading and trailing whitespace.
 * 2. Replaces multiple spaces with a single space.
 * 3. Normalizes all forms of Alef (أ, إ, آ) to a bare Alef (ا).
 * 4. Normalizes Taa Marbuta (ة) to Haa (ه).
 * 5. Normalizes Alif Maksura (ى) to Yaa (ي).
 * 
 * @param value The input text to normalize.
 * @returns The normalized string, or null if the input is empty or invalid.
 */
export function normalizeArabicText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed
    .replace(/[أإآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ");
}
