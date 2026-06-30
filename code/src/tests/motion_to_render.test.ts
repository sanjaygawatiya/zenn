import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateStoryboardIR } from '../core/ir/storyboard.js';
import { validateLayoutIR } from '../core/ir/layout.js';
import { validateTimelineIR } from '../core/ir/timeline.js';
import { validateCameraIR } from '../core/ir/camera.js';
import { validateMotionIR } from '../core/ir/motion.js';
import { MotionToRenderCompiler } from '../core/compiler/motion_to_render.js';
import { createDefaultContext } from '../core/compiler/context.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = join(__dirname, '../fixtures');

describe('Motion to Render Compiler (CP-005) Tests', () => {
  it('should compile valid inputs successfully (Success Test)', () => {
    const stb = validateStoryboardIR(JSON.parse(readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8')));
    const lay = validateLayoutIR(JSON.parse(readFileSync(join(FIXTURES_DIR, 'layout/phantom_phone.json'), 'utf8')));
    const tim = validateTimelineIR(JSON.parse(readFileSync(join(FIXTURES_DIR, 'timeline/phantom_phone.json'), 'utf8')));
    const cam = validateCameraIR(JSON.parse(readFileSync(join(FIXTURES_DIR, 'camera/phantom_phone.json'), 'utf8')));
    const mot = validateMotionIR(JSON.parse(readFileSync(join(FIXTURES_DIR, 'motion/phantom_phone.json'), 'utf8')));

    expect(stb.success && lay.success && tim.success && cam.success && mot.success).toBe(true);

    if (stb.success && lay.success && tim.success && cam.success && mot.success) {
      const context = createDefaultContext();
      const compiler = new MotionToRenderCompiler();
      const result = compiler.compile({
        storyboard: stb.data,
        layout: lay.data,
        timeline: tim.data,
        camera: cam.data,
        motion: mot.data,
      }, context);
      expect(result.success).toBe(true);
      expect(context.metrics.metrics['CP-005-AssetsCompiled']).toBe(2);
    }
  });

  it('should match Golden render file values (Golden Test)', () => {
    const stb = validateStoryboardIR(JSON.parse(readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8')));
    const lay = validateLayoutIR(JSON.parse(readFileSync(join(FIXTURES_DIR, 'layout/phantom_phone.json'), 'utf8')));
    const tim = validateTimelineIR(JSON.parse(readFileSync(join(FIXTURES_DIR, 'timeline/phantom_phone.json'), 'utf8')));
    const cam = validateCameraIR(JSON.parse(readFileSync(join(FIXTURES_DIR, 'camera/phantom_phone.json'), 'utf8')));
    const mot = validateMotionIR(JSON.parse(readFileSync(join(FIXTURES_DIR, 'motion/phantom_phone.json'), 'utf8')));
    const expectedRender = JSON.parse(readFileSync(join(FIXTURES_DIR, 'render/phantom_phone.json'), 'utf8'));

    if (stb.success && lay.success && tim.success && cam.success && mot.success) {
      const context = createDefaultContext();
      const compiler = new MotionToRenderCompiler();
      const result = compiler.compile({
        storyboard: stb.data,
        layout: lay.data,
        timeline: tim.data,
        camera: cam.data,
        motion: mot.data,
      }, context);
      expect(result.success).toBe(true);

      if (result.success) {
        const compiled = result.data;
        expect(compiled.resolution.width).toBe(expectedRender.resolution.width);
        expect(compiled.resolution.height).toBe(expectedRender.resolution.height);
        expect(compiled.fps).toBe(expectedRender.fps);
      }
    }
  });
});
