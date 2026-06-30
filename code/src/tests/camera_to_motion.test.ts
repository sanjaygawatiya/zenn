import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateStoryboardIR } from '../core/ir/storyboard.js';
import { validateLayoutIR } from '../core/ir/layout.js';
import { validateTimelineIR } from '../core/ir/timeline.js';
import { validateCameraIR } from '../core/ir/camera.js';
import { validateMotionIR } from '../core/ir/motion.js';
import { StoryboardToLayoutCompiler } from '../core/compiler/storyboard_to_layout.js';
import { LayoutToTimelineCompiler } from '../core/compiler/layout_to_timeline.js';
import { TimelineToCameraCompiler } from '../core/compiler/timeline_to_camera.js';
import { CameraToMotionCompiler } from '../core/compiler/camera_to_motion.js';
import { createDefaultContext } from '../core/compiler/context.js';
import { MotionBuilder } from '../core/builders/motion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = join(__dirname, '../fixtures');

describe('Camera to Motion Compiler (CP-004) Tests', () => {
  it('should compile valid inputs successfully (Success Test)', () => {
    const rawStb = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const stb = validateStoryboardIR(JSON.parse(rawStb));
    const rawLay = readFileSync(join(FIXTURES_DIR, 'layout/phantom_phone.json'), 'utf8');
    const lay = validateLayoutIR(JSON.parse(rawLay));
    const rawTim = readFileSync(join(FIXTURES_DIR, 'timeline/phantom_phone.json'), 'utf8');
    const tim = validateTimelineIR(JSON.parse(rawTim));
    const rawCam = readFileSync(join(FIXTURES_DIR, 'camera/phantom_phone.json'), 'utf8');
    const cam = validateCameraIR(JSON.parse(rawCam));

    expect(stb.success && lay.success && tim.success && cam.success).toBe(true);

    if (stb.success && lay.success && tim.success && cam.success) {
      const context = createDefaultContext();
      const compiler = new CameraToMotionCompiler();
      const result = compiler.compile({ storyboard: stb.data, layout: lay.data, timeline: tim.data, camera: cam.data }, context);
      expect(result.success).toBe(true);
      expect(context.metrics.metrics['CP-004-MotionsResolved']).toBe(2);
    }
  });

  it('should match Golden motion file values (Golden Test)', () => {
    const rawStb = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const stb = validateStoryboardIR(JSON.parse(rawStb));
    const rawLay = readFileSync(join(FIXTURES_DIR, 'layout/phantom_phone.json'), 'utf8');
    const lay = validateLayoutIR(JSON.parse(rawLay));
    const rawTim = readFileSync(join(FIXTURES_DIR, 'timeline/phantom_phone.json'), 'utf8');
    const tim = validateTimelineIR(JSON.parse(rawTim));
    const rawCam = readFileSync(join(FIXTURES_DIR, 'camera/phantom_phone.json'), 'utf8');
    const cam = validateCameraIR(JSON.parse(rawCam));
    const rawMot = readFileSync(join(FIXTURES_DIR, 'motion/phantom_phone.json'), 'utf8');
    const expectedMotion = JSON.parse(rawMot);

    if (stb.success && lay.success && tim.success && cam.success) {
      const context = createDefaultContext();
      const compiler = new CameraToMotionCompiler();
      const result = compiler.compile({ storyboard: stb.data, layout: lay.data, timeline: tim.data, camera: cam.data }, context);
      expect(result.success).toBe(true);

      if (result.success) {
        const compiled = result.data;
        expect(compiled.aspectRatio).toBe(expectedMotion.aspectRatio);
        expect(compiled.sceneId).toBe(expectedMotion.sceneId);
        expect(compiled.motionProgram.length).toBe(expectedMotion.motionProgram.length);
        expect(compiled.motionProgram[0]?.intentToken).toBe(expectedMotion.motionProgram[0]?.intentToken);
      }
    }
  });

  it('should fail if asset budget limit is exceeded (Failure Test)', () => {
    const builder = new MotionBuilder()
      .id('MOT-BUDGET')
      .storyboardId('STB-1')
      .sceneId('SCN-0001')
      .aspectRatio('16_9')
      .addProgramItem({
        programId: 'MOT-1',
        targetAssetId: 'phone_body',
        category: 'Structural',
        priority: 'Critical',
        intentToken: 'ENTER',
        direction: 'none',
        speed: 'MEDIUM',
        startMs: 0,
        durationMs: 500,
        motivation: 'reveal'
      })
      .addProgramItem({
        programId: 'MOT-2',
        targetAssetId: 'phone_body',
        category: 'Attention',
        priority: 'Normal',
        intentToken: 'EMPHASIZE',
        direction: 'none',
        speed: 'MEDIUM',
        startMs: 500,
        durationMs: 1000,
        motivation: 'emphasize'
      })
      .addProgramItem({
        programId: 'MOT-3',
        targetAssetId: 'phone_body',
        category: 'Attention',
        priority: 'Normal',
        intentToken: 'EMPHASIZE',
        direction: 'none',
        speed: 'MEDIUM',
        startMs: 1500,
        durationMs: 1000,
        motivation: 'emphasize'
      })
      .addProgramItem({
        programId: 'MOT-4',
        targetAssetId: 'phone_body',
        category: 'Structural',
        priority: 'Critical',
        intentToken: 'EXIT',
        direction: 'none',
        speed: 'MEDIUM',
        startMs: 2500,
        durationMs: 1000,
        motivation: 'transition'
      });

    expect(() => builder.build()).toThrow('Motion budget exceeded');
  });

  it('should be deterministic over repeated runs (Determinism Test)', () => {
    const rawStb = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const stb = validateStoryboardIR(JSON.parse(rawStb));
    const rawLay = readFileSync(join(FIXTURES_DIR, 'layout/phantom_phone.json'), 'utf8');
    const lay = validateLayoutIR(JSON.parse(rawLay));
    const rawTim = readFileSync(join(FIXTURES_DIR, 'timeline/phantom_phone.json'), 'utf8');
    const tim = validateTimelineIR(JSON.parse(rawTim));
    const rawCam = readFileSync(join(FIXTURES_DIR, 'camera/phantom_phone.json'), 'utf8');
    const cam = validateCameraIR(JSON.parse(rawCam));

    if (stb.success && lay.success && tim.success && cam.success) {
      const fingerprints: string[] = [];
      for (let i = 0; i < 20; i++) {
        const context = createDefaultContext();
        const compiler = new CameraToMotionCompiler();
        const res = compiler.compile({ storyboard: stb.data, layout: lay.data, timeline: tim.data, camera: cam.data }, context);
        expect(res.success).toBe(true);
        if (res.success) {
          fingerprints.push(res.data.fingerprint);
        }
      }
      const unique = [...new Set(fingerprints)];
      expect(unique.length).toBe(1);
    }
  });

  it('should run end-to-end storyboard -> layout -> timeline -> camera -> motion chain successfully (Pipeline Integration Test)', () => {
    const rawStb = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const stb = validateStoryboardIR(JSON.parse(rawStb));
    expect(stb.success).toBe(true);

    if (stb.success) {
      const context = createDefaultContext();

      // Pass 1: Storyboard -> Layout
      const layoutResult = StoryboardToLayoutCompiler.compile(context, stb.data);
      expect(layoutResult.success).toBe(true);

      if (layoutResult.success) {
        // Pass 2: Layout -> Timeline
        const timelineCompiler = new LayoutToTimelineCompiler();
        const timelineResult = timelineCompiler.compile({
          storyboard: stb.data,
          layout: layoutResult.data
        }, context);
        expect(timelineResult.success).toBe(true);

        if (timelineResult.success) {
          // Pass 3: Timeline -> Camera
          const cameraCompiler = new TimelineToCameraCompiler();
          const cameraResult = cameraCompiler.compile({
            storyboard: stb.data,
            layout: layoutResult.data,
            timeline: timelineResult.data
          }, context);
          expect(cameraResult.success).toBe(true);

          if (cameraResult.success) {
            // Pass 4: Camera -> Motion
            const motionCompiler = new CameraToMotionCompiler();
            const motionResult = motionCompiler.compile({
              storyboard: stb.data,
              layout: layoutResult.data,
              timeline: timelineResult.data,
              camera: cameraResult.data
            }, context);

            expect(motionResult.success).toBe(true);
            if (motionResult.success) {
              expect(motionResult.data.motionProgram.length).toBe(3);
              expect(motionResult.data.motionProgram[0]?.intentToken).toBe('ENTER');
              expect(motionResult.data.motionProgram[0]?.speed).toBe('MEDIUM');
            }
          }
        }
      }
    }
  });
});
