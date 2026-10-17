// Regression tests for utils/imageOptimizer.ts (the optimization engine, unchanged by the redesign).
// The browser Canvas/Image APIs are replaced by a deterministic fake whose encoded size depends on
// dimensions, quality and format, so the engine's Smart/Basic decisions can be checked in Node.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import type { OptimizationSettings } from '../types';
import { DEFAULT_SETTINGS } from '../lib/optimizationSettings';

const dims = new Map<string, { w: number; h: number } | 'broken'>();
let urlCounter = 0;
const encodes: { w: number; h: number; q: number; mime: string }[] = [];

/** Fake encoder: ~bits-per-pixel grows with quality; PNG ignores quality. */
const encodedSize = (w: number, h: number, q: number, mime: string) =>
  Math.round(w * h * (mime === 'image/png' ? 1.2 : 0.04 + 1.6 * q * q * q));

before(() => {
  const g = globalThis as any;
  g.URL.createObjectURL = (obj: any) => {
    const url = `blob:fake/${++urlCounter}`;
    dims.set(url, obj.__dims || { w: 1, h: 1 });
    return url;
  };
  g.Image = class {
    width = 0; height = 0; onload: any; onerror: any; _src = '';
    get src() { return this._src; }
    set src(v: string) {
      this._src = v;
      setTimeout(() => {
        const d = dims.get(v);
        if (!d || d === 'broken') return this.onerror?.(new Error('decode'));
        this.width = d.w; this.height = d.h; this.onload?.();
      }, 0);
    }
  };
  g.document = {
    createElement: (tag: string) => {
      assert.equal(tag, 'canvas');
      return {
        width: 0, height: 0,
        getContext() { return { imageSmoothingEnabled: false, imageSmoothingQuality: 'low', drawImage() {} }; },
        toBlob(cb: (b: Blob) => void, mime: string, q: number) {
          encodes.push({ w: this.width, h: this.height, q, mime });
          cb(new Blob([new Uint8Array(encodedSize(this.width, this.height, q ?? 0.92, mime))], { type: mime }));
        },
      };
    },
  };
});

const fakeFile = (name: string, size: number, w: number, h: number | 'broken') => {
  const f = new File([new Uint8Array(size)], name, { type: 'image/jpeg' }) as any;
  f.__dims = h === 'broken' ? 'broken' : { w, h };
  return f as File;
};

const run = async (file: File, settings: Partial<OptimizationSettings> = {}) => {
  const { optimizeImage } = await import('../utils/imageOptimizer');
  encodes.length = 0;
  return optimizeImage(file, { ...DEFAULT_SETTINGS, ...settings });
};

test('Smart mode: large photo is scaled by a whole-number factor, then tuned to the target', async () => {
  const r = await run(fakeFile('product-photo.jpg', 3_300_000, 3000, 2000));
  // effective min width = ceil(max(750, 750 × 1.5)) = 1125 → divisor floor(2999.5 / 1125) = 2
  assert.equal(r.steps![1].label, 'Scaled 1/2 (99% Quality)');
  assert.equal(r.steps![1].width, 1500);
  assert.ok(r.width >= 1125, 'never below the minimum edge');
  assert.ok(r.quality >= 0.75 - 1e-9, 'never below the quality floor');
  assert.ok(r.iterations <= 25);
  assert.equal(r.extension, 'webp');
  assert.equal(r.blob.type, 'image/webp');
  assert.equal(r.compressedSize, r.blob.size, 'reported size is the real encoded size');
  assert.equal(r.originalSize, 3_300_000);
  assert.match(r.strategyLabel!, /^Scaled 1\/2/);
  // Snapshot of the engine's decisions for this input (documents current behaviour).
  assert.deepEqual({ w: r.width, h: r.height, q: r.quality, it: r.iterations }, { w: 1125, h: 750, q: 0.75, it: 9 });
  // Original + scaled step + one step per pass; the final pass stopped without encoding (nothing left to reduce).
  assert.equal(r.steps!.length, 10);
});

test('Smart mode: image already within the target in the same format is returned untouched', async () => {
  const f = fakeFile('small.webp', 50_000, 800, 600);
  const r = await run(f);
  assert.equal(r.blob, f);
  assert.equal(r.infoMessage, 'Original < Target Size');
  assert.equal(r.compressedSize, 50_000);
  assert.equal(encodes.length, 0, 'nothing re-encoded');
});

test('Smart mode: small file in a different format is still converted', async () => {
  const r = await run(fakeFile('small.png', 50_000, 400, 300));
  assert.equal(r.extension, 'webp');
  assert.ok(encodes.length >= 1);
});

test('Smart mode: target met right after scaling stops early', async () => {
  const r = await run(fakeFile('huge.jpg', 9_000_000, 6000, 4000), { targetSizeKB: 1000 });
  // min width 1125 → divisor floor(5999.5/1125) = 5 → 1200×800 at 99% ≈ 1.6 MB > 1000 KB, so tuning continues
  assert.equal(r.steps![1].width, 1200);
  const relaxed = await run(fakeFile('huge.jpg', 9_000_000, 6000, 4000), { targetSizeKB: 2000 });
  assert.equal(relaxed.iterations, 0);
  assert.equal(relaxed.strategyLabel, 'Scaled 1/5 (Target Met)');
});

test('Smart mode: PNG output keeps quality at 100% and only reduces dimensions', async () => {
  const r = await run(fakeFile('diagram.jpg', 2_000_000, 1600, 1000), { outputFormat: 'png' });
  assert.equal(r.extension, 'png');
  assert.ok(encodes.every(e => e.mime === 'image/png'));
  assert.equal(r.quality, 1.0);
  assert.ok(r.width >= 1200, 'min width = ceil(max(750, 750×1.6)) = 1200');
});

test('Smart mode: manual minimum width/height are respected', async () => {
  const r = await run(fakeFile('p.jpg', 3_000_000, 3000, 2000), { useSmartDimension: false, minWidth: 2000, minHeight: 0 });
  assert.ok(r.width >= 2000);
});

test('Basic mode: single encode at the target quality, dimensions kept or resized with aspect ratio', async () => {
  const r = await run(fakeFile('p.jpg', 3_000_000, 3000, 2000), { mode: 'basic' });
  assert.equal(encodes.length, 1);
  assert.equal(encodes[0].q, 0.9);
  assert.equal(r.width, 3000);
  assert.equal(r.iterations, 1);
  const resized = await run(fakeFile('p.jpg', 3_000_000, 3000, 2000), { mode: 'basic', resizeWidth: 1500 });
  assert.deepEqual([resized.width, resized.height], [1500, 1000]);
});

test('JPEG output uses image/jpeg and the .jpg extension', async () => {
  const r = await run(fakeFile('p.png', 3_000_000, 3000, 2000), { outputFormat: 'jpeg' });
  assert.equal(r.extension, 'jpg');
  assert.equal(r.blob.type, 'image/jpeg');
});

test('undecodable images reject (so one failure cannot corrupt other results)', async () => {
  await assert.rejects(run(fakeFile('broken.jpg', 1000, 0, 'broken')), /Failed to load image/);
});
