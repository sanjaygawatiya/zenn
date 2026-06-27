import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateStoryboardIR } from '../core/ir/storyboard.js';
import { validateLayoutIR } from '../core/ir/layout.js';
import { StoryboardToLayoutCompiler } from '../core/compiler/storyboard_to_layout.js';
import { LayoutToTimelineCompiler } from '../core/compiler/layout_to_timeline.js';
import { createDefaultContext } from '../core/compiler/context.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = join(__dirname, '../fixtures');

describe('Layout to Timeline Compiler (CP-002) Tests', () => {
  it('should compile valid Layout and Storyboard successfully (Success Test)', () => {
    const rawStb = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const stb = validateStoryboardIR(JSON.parse(rawStb));
    expect(stb.success).toBe(true);

    const rawLay = readFileSync(join(FIXTURES_DIR, 'layout/phantom_phone.json'), 'utf8');
    const lay = validateLayoutIR(JSON.parse(rawLay));
    expect(lay.success).toBe(true);

    if (stb.success && lay.success) {
      const context = createDefaultContext();
      const compiler = new LayoutToTimelineCompiler();
      const result = compiler.compile({ storyboard: stb.data, layout: lay.data }, context);
      expect(result.success).toBe(true);
      expect(context.metrics.metrics['CP-002-VisualEventsScheduled']).toBe(2);
    }
  });

  it('should match Golden timeline file values (Golden Test)', () => {
    const rawStb = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const stb = validateStoryboardIR(JSON.parse(rawStb));
    const rawLay = readFileSync(join(FIXTURES_DIR, 'layout/phantom_phone.json'), 'utf8');
    const lay = validateLayoutIR(JSON.parse(rawLay));
    const rawTim = readFileSync(join(FIXTURES_DIR, 'timeline/phantom_phone.json'), 'utf8');
    const expectedTimeline = JSON.parse(rawTim);

    if (stb.success && lay.success) {
      const context = createDefaultContext();
      const compiler = new LayoutToTimelineCompiler();
      const result = compiler.compile({ storyboard: stb.data, layout: lay.data }, context);
      expect(result.success).toBe(true);

      if (result.success) {
        const compiled = result.data;
        expect(compiled.sceneId).toBe(expectedTimeline.sceneId);
        expect(compiled.masterClockMs).toBe(expectedTimeline.masterClockMs);
        expect(compiled.tracks.captions.length).toBe(expectedTimeline.tracks.captions.length);
        expect(compiled.tracks.captions[0]?.eventId).toBe(expectedTimeline.tracks.captions[0]?.eventId);
      }
    }
  });

  it('should fail if scene duration is zero or negative (Failure Test)', () => {
    const rawStb = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const stb = JSON.parse(rawStb);
    stb.scenes[0].durationMs = 0;
    const stbResult = validateStoryboardIR(stb);
    expect(stbResult.success).toBe(true);

    const rawLay = readFileSync(join(FIXTURES_DIR, 'layout/phantom_phone.json'), 'utf8');
    const lay = validateLayoutIR(JSON.parse(rawLay));

    if (stbResult.success && lay.success) {
      const context = createDefaultContext();
      const compiler = new LayoutToTimelineCompiler();
      const result = compiler.compile({ storyboard: stbResult.data, layout: lay.data }, context);
      expect(result.success).toBe(false);
      expect(context.diagnostics.hasErrors).toBe(true);
    }
  });

  it('should be deterministic over repeated runs (Determinism Test)', () => {
    const rawStb = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const stb = validateStoryboardIR(JSON.parse(rawStb));
    const rawLay = readFileSync(join(FIXTURES_DIR, 'layout/phantom_phone.json'), 'utf8');
    const lay = validateLayoutIR(JSON.parse(rawLay));

    if (stb.success && lay.success) {
      const fingerprints: string[] = [];
      for (let i = 0; i < 20; i++) {
        const context = createDefaultContext();
        const compiler = new LayoutToTimelineCompiler();
        const res = compiler.compile({ storyboard: stb.data, layout: lay.data }, context);
        expect(res.success).toBe(true);
        if (res.success) {
          fingerprints.push(res.data.fingerprint);
        }
      }
      const unique = [...new Set(fingerprints)];
      expect(unique.length).toBe(1);
    }
  });

  it('should satisfy Integer Milliseconds constraint (Integer Millisecond Test)', () => {
    const rawStb = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const stb = validateStoryboardIR(JSON.parse(rawStb));
    const rawLay = readFileSync(join(FIXTURES_DIR, 'layout/phantom_phone.json'), 'utf8');
    const lay = validateLayoutIR(JSON.parse(rawLay));

    if (stb.success && lay.success) {
      const context = createDefaultContext();
      const compiler = new LayoutToTimelineCompiler();
      const res = compiler.compile({ storyboard: stb.data, layout: lay.data }, context);
      expect(res.success).toBe(true);
      if (res.success) {
        const compiled = res.data;
        expect(compiled.masterClockMs % 1).toBe(0);
        for (const event of compiled.tracks.visual) {
          expect(event.startMs % 1).toBe(0);
          expect(event.durationMs % 1).toBe(0);
        }
      }
    }
  });

  it('should run end-to-end storyboard -> layout -> timeline chain successfully (Pipeline Integration Test)', () => {
    const rawStb = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const stb = validateStoryboardIR(JSON.parse(rawStb));
    expect(stb.success).toBe(true);

    if (stb.success) {
      const context = createDefaultContext();

      const layoutResult = StoryboardToLayoutCompiler.compile(context, stb.data);
      expect(layoutResult.success).toBe(true);

      if (layoutResult.success) {
        const timelineCompiler = new LayoutToTimelineCompiler();
        const timelineResult = timelineCompiler.compile({
          storyboard: stb.data,
          layout: layoutResult.data
        }, context);

        expect(timelineResult.success).toBe(true);
        if (timelineResult.success) {
          expect(timelineResult.data.tracks.visual.length).toBe(2);
        }
      }
    }
  });
});
