import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateStoryboardIR } from '../core/ir/storyboard.js';
import { StoryboardToLayoutCompiler } from '../core/compiler/storyboard_to_layout.js';
import { createDefaultContext } from '../core/compiler/context.js';
import { StoryboardBuilder } from '../core/builders/storyboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = join(__dirname, '../fixtures');

describe('Storyboard to Layout Compiler (CP-001) Tests', () => {
  it('should compile valid Storyboard IR successfully (Success Test)', () => {
    const rawStb = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const stbJson = JSON.parse(rawStb);
    const stbResult = validateStoryboardIR(stbJson);
    expect(stbResult.success).toBe(true);

    if (stbResult.success) {
      const context = createDefaultContext();
      const layoutResult = StoryboardToLayoutCompiler.compile(context, stbResult.data);
      expect(layoutResult.success).toBe(true);
      expect(context.metrics.metrics['CP-001-AssetsRegistered']).toBe(2);
    }
  });

  it('should match Golden layout file values (Golden Test)', () => {
    const rawStb = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const stb = JSON.parse(rawStb);
    const stbResult = validateStoryboardIR(stb);
    expect(stbResult.success).toBe(true);

    const rawLay = readFileSync(join(FIXTURES_DIR, 'layout/phantom_phone.json'), 'utf8');
    const expectedLayout = JSON.parse(rawLay);

    if (stbResult.success) {
      const context = createDefaultContext();
      const layoutResult = StoryboardToLayoutCompiler.compile(context, stbResult.data);
      expect(layoutResult.success).toBe(true);

      if (layoutResult.success) {
        const compiled = layoutResult.data;
        expect(compiled.aspectRatio).toBe(expectedLayout.aspectRatio);
        expect(compiled.sceneId).toBe(expectedLayout.sceneId);
        expect(compiled.layoutAssets.length).toBe(expectedLayout.layoutAssets.length);
        
        const phone = compiled.layoutAssets.find(a => a.assetId === 'phone_body');
        const expectedPhone = expectedLayout.layoutAssets.find((a: any) => a.assetId === 'phone_body');
        expect(phone?.centerX).toBe(expectedPhone.centerX);
        expect(phone?.centerY).toBe(expectedPhone.centerY);
      }
    }
  });

  it('should fail if storyboard lacks primary subject (Failure Test)', () => {
    const context = createDefaultContext();
    const invalidStb = new StoryboardBuilder()
      .id('STB-INVALID')
      .addScene({
        sceneId: 'SCN-0001',
        objective: 'Test invalid subject',
        rawScript: 'No script.',
        timingOffsetMs: 0,
        durationMs: 5000,
        assets: [
          {
            assetId: 'label_only',
            type: 'TXT',
            role: 'label',
            style: 'standard',
            mustRemainVisible: false
          }
        ]
      })
      .build();

    const result = StoryboardToLayoutCompiler.compile(context, invalidStb);
    expect(result.success).toBe(false);
    expect(context.diagnostics.hasErrors).toBe(true);
  });

  it('should be deterministic over repeated runs (Determinism Test)', () => {
    const rawStb = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const stb = validateStoryboardIR(JSON.parse(rawStb));
    expect(stb.success).toBe(true);

    if (stb.success) {
      const fingerprints: string[] = [];
      for (let i = 0; i < 20; i++) {
        const context = createDefaultContext();
        const res = StoryboardToLayoutCompiler.compile(context, stb.data);
        expect(res.success).toBe(true);
        if (res.success) {
          fingerprints.push(res.data.fingerprint);
        }
      }
      const unique = [...new Set(fingerprints)];
      expect(unique.length).toBe(1);
    }
  });
});
