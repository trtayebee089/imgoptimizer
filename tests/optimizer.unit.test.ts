import { test } from 'node:test';
import assert from 'node:assert/strict';
import { savedPercent, formatSavedPercent, sumTotals } from '../lib/savings';
import { sniffFormat, validateFileHead, validateDimensions, safeFileName, withExtension, uniqueNames, MAX_FILE_BYTES } from '../lib/fileValidation';
import { sanitizeSettings, DEFAULT_SETTINGS } from '../lib/optimizationSettings';
import { parseRecords } from '../server/history';

const bytes = (...b: (number | string)[]) => {
  const out: number[] = [];
  for (const x of b) typeof x === 'string' ? out.push(...Array.from(x).map(c => c.charCodeAt(0))) : out.push(x);
  return new Uint8Array(out);
};

test('savings: percentage formula, growth and zero-byte inputs', () => {
  assert.equal(savedPercent(1000, 250), 75);
  assert.equal(savedPercent(1000, 1200), -20, 'larger output is reported as negative savings');
  assert.equal(savedPercent(0, 0), null, 'zero-byte input has no percentage');
  assert.equal(formatSavedPercent(1000, 250), '−75%');
  assert.equal(formatSavedPercent(1000, 1200), '+20% larger');
  assert.equal(formatSavedPercent(1000, 1000), '0%');
  assert.equal(formatSavedPercent(0, 10), '—');
  assert.deepEqual(sumTotals([{ originalBytes: 100, outputBytes: 40 }, { originalBytes: 50, outputBytes: 60 }]), { originalBytes: 150, outputBytes: 100, savedBytes: 50 });
});

test('file signatures are detected from content, not names', () => {
  assert.equal(sniffFormat(bytes(0xff, 0xd8, 0xff, 0xe0)), 'jpeg');
  assert.equal(sniffFormat(bytes(0x89, 'PNG', 0x0d, 0x0a, 0x1a, 0x0a)), 'png');
  assert.equal(sniffFormat(bytes('RIFF', 0, 0, 0, 0, 'WEBP')), 'webp');
  assert.equal(sniffFormat(bytes('GIF89a')), 'gif');
  assert.equal(sniffFormat(bytes(0, 0, 0, 0x1c, 'ftypavif')), 'avif');
  assert.equal(sniffFormat(bytes(0, 0, 0, 0x18, 'ftypheic')), 'heic');
  assert.equal(sniffFormat(bytes('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg">')), 'svg');
  assert.equal(sniffFormat(bytes('%PDF-1.7')), null);
  assert.equal(sniffFormat(bytes('MZ', 0x90, 0)), null, 'executables are rejected');
  assert.equal(sniffFormat(bytes('RIFF', 0, 0, 0, 0, 'WAVE')), null);
});

test('file limits', () => {
  const jpeg = bytes(0xff, 0xd8, 0xff, 0xe0);
  assert.deepEqual(validateFileHead({ size: 1000 }, jpeg), { ok: true, format: 'jpeg' });
  assert.equal((validateFileHead({ size: 0 }, jpeg) as any).ok, false);
  assert.match((validateFileHead({ size: MAX_FILE_BYTES + 1 }, jpeg) as any).reason, /larger than/);
  assert.match((validateFileHead({ size: 10 }, bytes('hello')) as any).reason, /Unsupported/);
  assert.equal(validateDimensions(4000, 3000), null);
  assert.match(validateDimensions(12000, 9000)!, /megapixels/);
  assert.ok(validateDimensions(0, 100));
});

test('download names are safe and unique', () => {
  assert.equal(safeFileName('../../etc/passwd'), '_.._etc_passwd', 'no path separators survive');
  assert.ok(!/[\\/]/.test(safeFileName('a/b\\c')));
  assert.equal(safeFileName('a\\b:c*?.jpg'), 'a_b_c_.jpg');
  assert.equal(safeFileName('   '), 'image');
  assert.equal(withExtension('photo.final.JPG', 'webp'), 'photo.final.webp');
  assert.deepEqual(uniqueNames(['a.webp', 'A.webp', 'a.webp', 'a (2).webp']), ['a.webp', 'A (2).webp', 'a (3).webp', 'a (2) (2).webp']);
});

test('saved optimization preferences are validated', () => {
  assert.deepEqual(sanitizeSettings(DEFAULT_SETTINGS), DEFAULT_SETTINGS);
  assert.equal(sanitizeSettings({ ...DEFAULT_SETTINGS, outputFormat: 'gif' }), null);
  assert.equal(sanitizeSettings({ ...DEFAULT_SETTINGS, minQuality: 0 }), null);
  assert.equal(sanitizeSettings({ ...DEFAULT_SETTINGS, targetSizeKB: '100' }), null);
  assert.equal(sanitizeSettings(null), null);
  const withExtra = sanitizeSettings({ ...DEFAULT_SETTINGS, evil: '$where' }) as any;
  assert.equal(withExtra.evil, undefined, 'unknown fields are dropped');
});

test('history records are validated before storage', () => {
  const ok = { status: 'optimized', originalBytes: 1000, outputBytes: 300, inputFormat: 'JPEG', outputFormat: 'webp', mode: 'smart' };
  const parsed = parseRecords({ batchId: 'abcdef1234567890', records: [ok] });
  assert.ok(!('error' in parsed));
  assert.equal((parsed as any).records[0].inputFormat, 'jpeg');
  assert.ok('error' in parseRecords({ batchId: 'x', records: [ok] }), 'short batch id');
  assert.ok('error' in parseRecords({ batchId: 'abcdef1234567890', records: [] }));
  assert.ok('error' in parseRecords({ batchId: 'abcdef1234567890', records: [{ ...ok, originalBytes: -1 }] }));
  assert.ok('error' in parseRecords({ batchId: 'abcdef1234567890', records: [{ ...ok, outputBytes: 1.5 }] }));
  assert.ok('error' in parseRecords({ batchId: 'abcdef1234567890', records: [{ ...ok, status: 'failed' }] }), 'failed records carry no output');
  assert.ok('error' in parseRecords({ batchId: 'abcdef1234567890', records: [{ ...ok, outputFormat: 'exe' }] }));
  assert.ok('error' in parseRecords({ batchId: 'abcdef1234567890', records: Array(51).fill(ok) }));
  const weird = parseRecords({ batchId: 'abcdef1234567890', records: [{ ...ok, inputFormat: '<script>' }] }) as any;
  assert.equal(weird.records[0].inputFormat, 'unknown');
});
