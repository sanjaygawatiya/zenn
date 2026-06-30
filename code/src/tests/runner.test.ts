import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateStoryboardIR } from '../core/ir/storyboard.js';
import { PipelineRunner } from '../core/compiler/runner.js';
import { MotionCanvasAdapter } from '../core/adapter/motion_canvas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = join(__dirname, '../fixtures');

describe('End-to-End Pipeline Integration & Adapter Tests', () => {
  it('should compile the complete storyboard -> audio pipeline successfully', () => {
    const rawStb = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const stb = validateStoryboardIR(JSON.parse(rawStb));
    expect(stb.success).toBe(true);

    if (stb.success) {
      const result = PipelineRunner.run(stb.data);
      expect(result.success).toBe(true);
      expect(result.layout).toBeDefined();
      expect(result.timeline).toBeDefined();
      expect(result.camera).toBeDefined();
      expect(result.motion).toBeDefined();
      expect(result.render).toBeDefined();
      expect(result.audio).toBeDefined();
    }
  });

  it('should be 100% deterministic across 100 runs', () => {
    const rawStb = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const stb = validateStoryboardIR(JSON.parse(rawStb));
    expect(stb.success).toBe(true);

    if (stb.success) {
      const renderFingerprints: string[] = [];
      const audioFingerprints: string[] = [];

      for (let i = 0; i < 100; i++) {
        const result = PipelineRunner.run(stb.data);
        expect(result.success).toBe(true);
        if (result.success && result.render && result.audio) {
          renderFingerprints.push(result.render.fingerprint);
          audioFingerprints.push(result.audio.fingerprint);
        }
      }

      const uniqueRnd = [...new Set(renderFingerprints)];
      const uniqueAud = [...new Set(audioFingerprints)];
      expect(uniqueRnd.length).toBe(1);
      expect(uniqueAud.length).toBe(1);
    }
  });

  it('should run adapter to export frames and output video MP4', async () => {
    const rawStb = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const stb = validateStoryboardIR(JSON.parse(rawStb));

    if (stb.success) {
      const result = PipelineRunner.run(stb.data);
      expect(result.success).toBe(true);

      if (result.success && result.render && result.audio) {
        const adapter = new MotionCanvasAdapter();
        const outputPath = './output.mp4';
        const renderResult = await adapter.render(result.render, result.audio, outputPath);
        expect(renderResult.success).toBe(true);
        expect(existsSync(outputPath)).toBe(true);
        expect(existsSync('./tmp/adapter_capability.json')).toBe(true);
        expect(existsSync('./tmp/adapter_diagnostics.json')).toBe(true);
      }
    }
  }, 30000);
});
