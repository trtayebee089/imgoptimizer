// Client-side checks before an image enters the queue. Images never leave the
// browser, so these limits protect the tab from running out of memory rather
// than a server.

export const MAX_FILE_BYTES = 40 * 1024 * 1024; // 40 MB
export const MAX_PIXELS = 80_000_000; // 80 megapixels (decoded RGBA ≈ 320 MB)
export const MAX_FILES_PER_ADD = 100;
export const MAX_QUEUE_SIZE = 200;

export type DetectedFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp' | 'avif' | 'heic' | 'tiff' | 'svg';

export const FORMAT_LABELS: Record<DetectedFormat, string> = {
  jpeg: 'JPEG', png: 'PNG', webp: 'WebP', gif: 'GIF', bmp: 'BMP', avif: 'AVIF', heic: 'HEIC', tiff: 'TIFF', svg: 'SVG',
};

export const ACCEPTED_DESCRIPTION = 'JPEG, PNG, WebP, GIF, AVIF, BMP or SVG';

const ascii = (b: Uint8Array, start: number, len: number) => String.fromCharCode(...b.subarray(start, start + len));

/** Identifies the format from the file's leading bytes (the browser-supplied MIME type is not trusted). */
export const sniffFormat = (head: Uint8Array): DetectedFormat | null => {
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'jpeg';
  if (head.length >= 8 && head[0] === 0x89 && ascii(head, 1, 3) === 'PNG' && head[4] === 0x0d && head[5] === 0x0a) return 'png';
  if (head.length >= 12 && ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 4) === 'WEBP') return 'webp';
  if (head.length >= 6 && (ascii(head, 0, 6) === 'GIF87a' || ascii(head, 0, 6) === 'GIF89a')) return 'gif';
  if (head.length >= 2 && head[0] === 0x42 && head[1] === 0x4d) return 'bmp';
  if (head.length >= 4 && ((head[0] === 0x49 && head[1] === 0x49 && head[2] === 0x2a && head[3] === 0) || (head[0] === 0x4d && head[1] === 0x4d && head[2] === 0 && head[3] === 0x2a))) return 'tiff';
  if (head.length >= 12 && ascii(head, 4, 4) === 'ftyp') {
    const brand = ascii(head, 8, 4);
    if (brand === 'avif' || brand === 'avis') return 'avif';
    if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand)) return 'heic';
  }
  // SVG is text: allow a BOM, XML prolog, comments or whitespace before the <svg tag.
  const text = new TextDecoder('utf-8', { fatal: false }).decode(head.subarray(0, Math.min(head.length, 1024))).replace(/^﻿/, '').trimStart();
  if (text.startsWith('<') && /<svg[\s>]/i.test(text)) return 'svg';
  return null;
};

export type ValidationResult = { ok: true; format: DetectedFormat } | { ok: false; reason: string };

export const validateFileHead = (file: { size: number }, head: Uint8Array): ValidationResult => {
  if (file.size === 0) return { ok: false, reason: 'This file is empty.' };
  if (file.size > MAX_FILE_BYTES) return { ok: false, reason: `This file is larger than the ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB limit.` };
  const format = sniffFormat(head);
  if (!format) return { ok: false, reason: `Unsupported file type. Use ${ACCEPTED_DESCRIPTION}.` };
  return { ok: true, format };
};

export const validateDimensions = (width: number, height: number): string | null => {
  if (!width || !height) return 'This image has no readable dimensions.';
  if (width * height > MAX_PIXELS) return `This image is ${Math.round((width * height) / 1e6)} megapixels; the limit is ${MAX_PIXELS / 1e6} MP to keep your browser responsive.`;
  return null;
};

/** Keeps a downloaded file name safe: no path separators, control or reserved characters. */
export const safeFileName = (name: string, fallback = 'image') => {
  const cleaned = name
    .replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+/g, '_')
    .replace(/^[.\s]+/, '')
    .trim()
    .slice(0, 180);
  return cleaned || fallback;
};

/** Replaces the extension of `name` with `ext`. */
export const withExtension = (name: string, ext: string) => {
  const base = name.replace(/\.[^/.]+$/, '');
  return `${base || 'image'}.${ext}`;
};

/** Makes names unique within an archive: photo.webp, photo (2).webp, … */
export const uniqueNames = (names: string[]) => {
  const used = new Set<string>();
  return names.map((n) => {
    let candidate = n;
    const m = n.match(/^(.*?)(\.[^.]+)?$/)!;
    for (let i = 2; used.has(candidate.toLowerCase()); i++) candidate = `${m[1]} (${i})${m[2] || ''}`;
    used.add(candidate.toLowerCase());
    return candidate;
  });
};
