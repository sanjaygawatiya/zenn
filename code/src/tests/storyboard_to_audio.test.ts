import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateStoryboardIR } from '../core/ir/storyboard.js';
import { validateTimelineIR } from '../core/ir/timeline.js';
import { StoryboardToAudioCompiler } from '../core/compiler/storyboard_to_audio.js';
import { createDefaultContext } from '../core/compiler/context.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = join(__dirname, '../fixtures');

describe('Storyboard to Audio Compiler (CP-006) Tests', () => {
  it('should compile valid inputs successfully (Success Test)', () => {
    const stb = validateStoryboardIR(JSON.parse(readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8')));
    const tim = validateTimelineIR(JSON.parse(readFileSync(join(FIXTURES_DIR, 'timeline/phantom_phone.json'), 'utf8')));

    expect(stb.success && tim.success).toBe(true);

    if (stb.success && tim.success) {
      const context = createDefaultContext();
      const compiler = new StoryboardToAudioCompiler();
      const result = compiler.compile({ storyboard: stb.data, timeline: tim.data }, context);
      expect(result.success).toBe(true);
      expect(context.metrics.metrics['CP-006-TracksCompiled']).toBe(5);
    }
  });

  it('should match Golden audio file values (Golden Test)', () => {
    const stb = validateStoryboardIR(JSON.parse(readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8')));
    const tim = validateTimelineIR(JSON.parse(readFileSync(join(FIXTURES_DIR, 'timeline/phantom_phone.json'), 'utf8')));
    const expectedAudio = JSON.parse(readFileSync(join(FIXTURES_DIR, 'audio/phantom_phone.json'), 'utf8'));

    if (stb.success && tim.success) {
      const context = createDefaultContext();
      const compiler = new StoryboardToAudioCompiler();
      const result = compiler.compile({ storyboard: stb.data, timeline: tim.data }, context);
      expect(result.success).toBe(true);

      if (result.success) {
        const compiled = result.data;
        expect(compiled.audioId).toBe(expectedAudio.audioId);
        expect(compiled.totalDurationMs).toBe(expectedAudio.totalDurationMs);
        expect(compiled.tracks.narration.length).toBe(expectedAudio.tracks.narration.length);
        expect(compiled.tracks.narration[0]?.resolvedFileUri).toBe(expectedAudio.tracks.narration[0]?.resolvedFileUri);
      }
    }
  });
});
