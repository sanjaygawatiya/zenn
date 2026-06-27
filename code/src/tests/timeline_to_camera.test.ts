import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateStoryboardIR } from '../core/ir/storyboard.js';
import { validateLayoutIR } from '../core/ir/layout.js';
import { validateTimelineIR } from '../core/ir/timeline.js';
import { validateCameraIR } from '../core/ir/camera.js';
import { StoryboardToLayoutCompiler } from '../core/compiler/storyboard_to_layout.js';
import { LayoutToTimelineCompiler } from '../core/compiler/layout_to_timeline.js';
import { TimelineToCameraCompiler } from '../core/compiler/timeline_to_camera.js';
import { createDefaultContext } from '../core/compiler/context.js';
import { TimelineBuilder } from '../core/builders/timeline.js';
import { CameraBuilder } from '../core/builders/camera.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = join(__dirname, '../fixtures');

describe('Timeline to Camera Compiler (CP-003) Tests', () => {
  it('should compile valid inputs successfully (Success Test)', () => {
    const rawStb = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const stb = validateStoryboardIR(JSON.parse(rawStb));
    const rawLay = readFileSync(join(FIXTURES_DIR, 'layout/phantom_phone.json'), 'utf8');
    const lay = validateLayoutIR(JSON.parse(rawLay));
    const rawTim = readFileSync(join(FIXTURES_DIR, 'timeline/phantom_phone.json'), 'utf8');
    const tim = validateTimelineIR(JSON.parse(rawTim));

    expect(stb.success && lay.success && tim.success).toBe(true);

    if (stb.success && lay.success && tim.success) {
      const context = createDefaultContext();
      const compiler = new TimelineToCameraCompiler();
      const result = compiler.compile({ storyboard: stb.data, layout: lay.data, timeline: tim.data }, context);
      expect(result.success).toBe(true);
      expect(context.metrics.metrics['CP-003-ProgramsResolved']).toBe(2);
    }
  });

  it('should match Golden camera file values (Golden Test)', () => {
    const rawStb = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const stb = validateStoryboardIR(JSON.parse(rawStb));
    const rawLay = readFileSync(join(FIXTURES_DIR, 'layout/phantom_phone.json'), 'utf8');
    const lay = validateLayoutIR(JSON.parse(rawLay));
    const rawTim = readFileSync(join(FIXTURES_DIR, 'timeline/phantom_phone.json'), 'utf8');
    const tim = validateTimelineIR(JSON.parse(rawTim));
    const rawCam = readFileSync(join(FIXTURES_DIR, 'camera/phantom_phone.json'), 'utf8');
    const expectedCamera = JSON.parse(rawCam);

    if (stb.success && lay.success && tim.success) {
      const context = createDefaultContext();
      const compiler = new TimelineToCameraCompiler();
      const result = compiler.compile({ storyboard: stb.data, layout: lay.data, timeline: tim.data }, context);
      expect(result.success).toBe(true);

      if (result.success) {
        const compiled = result.data;
        expect(compiled.aspectRatio).toBe(expectedCamera.aspectRatio);
        expect(compiled.sceneId).toBe(expectedCamera.sceneId);
        expect(compiled.cameraProgram.length).toBe(expectedCamera.cameraProgram.length);
        expect(compiled.cameraProgram[0]?.action).toBe(expectedCamera.cameraProgram[0]?.action);
      }
    }
  });

  it('should fail if camera program budget is exceeded (Failure Test)', () => {
    const builder = new CameraBuilder()
      .id('CAM-BUDGET')
      .storyboardId('STB-1')
      .sceneId('SCN-0001')
      .aspectRatio('16_9')
      .addProgramItem({
        programId: 'CAM-1',
        startMs: 0,
        durationMs: 1000,
        action: 'LOCK',
        motivation: 'Reveal',
        shotType: 'Close',
        framingRule: 'Centered',
        targetAssetId: 'phone_body',
        intensity: 'medium'
      })
      .addProgramItem({
        programId: 'CAM-2',
        startMs: 1000,
        durationMs: 2000,
        action: 'PUSH_SOFT',
        motivation: 'Inspect',
        shotType: 'Macro',
        framingRule: 'Centered',
        targetAssetId: 'phone_body',
        intensity: 'medium'
      })
      .addProgramItem({
        programId: 'CAM-3',
        startMs: 3000,
        durationMs: 2000,
        action: 'PULL_SOFT',
        motivation: 'Summarize',
        shotType: 'Overview',
        framingRule: 'Centered',
        targetAssetId: 'phone_body',
        intensity: 'medium'
      });

    expect(() => builder.build()).toThrow('Camera program budget exceeded');
  });

  it('should be deterministic over repeated runs (Determinism Test)', () => {
    const rawStb = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const stb = validateStoryboardIR(JSON.parse(rawStb));
    const rawLay = readFileSync(join(FIXTURES_DIR, 'layout/phantom_phone.json'), 'utf8');
    const lay = validateLayoutIR(JSON.parse(rawLay));
    const rawTim = readFileSync(join(FIXTURES_DIR, 'timeline/phantom_phone.json'), 'utf8');
    const tim = validateTimelineIR(JSON.parse(rawTim));

    if (stb.success && lay.success && tim.success) {
      const fingerprints: string[] = [];
      for (let i = 0; i < 20; i++) {
        const context = createDefaultContext();
        const compiler = new TimelineToCameraCompiler();
        const res = compiler.compile({ storyboard: stb.data, layout: lay.data, timeline: tim.data }, context);
        expect(res.success).toBe(true);
        if (res.success) {
          fingerprints.push(res.data.fingerprint);
        }
      }
      const unique = [...new Set(fingerprints)];
      expect(unique.length).toBe(1);
    }
  });

  it('should run end-to-end storyboard -> layout -> timeline -> camera chain successfully (Pipeline Integration Test)', () => {
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
          const cameraCompiler = new TimelineToCameraCompiler();
          const cameraResult = cameraCompiler.compile({
            storyboard: stb.data,
            layout: layoutResult.data,
            timeline: timelineResult.data
          }, context);

          expect(cameraResult.success).toBe(true);
          if (cameraResult.success) {
            expect(cameraResult.data.cameraProgram.length).toBe(2);
            expect(cameraResult.data.cameraProgram[1]?.action).toBe('PUSH_SOFT');
          }
        }
      }
    }
  });
});
