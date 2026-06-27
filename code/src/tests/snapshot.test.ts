import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateStoryboardIR } from '../core/ir/storyboard.js';
import { validateLayoutIR } from '../core/ir/layout.js';
import { validateTimelineIR } from '../core/ir/timeline.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = join(__dirname, '../fixtures');

describe('Snapshot Verification Tests', () => {
  it('should validate and parse Storyboard IR fixture successfully', () => {
    const raw = readFileSync(join(FIXTURES_DIR, 'storyboard/phantom_phone.json'), 'utf8');
    const json = JSON.parse(raw);
    const result = validateStoryboardIR(json);
    expect(result.success).toBe(true);
  });

  it('should validate and parse Layout IR fixture successfully', () => {
    const raw = readFileSync(join(FIXTURES_DIR, 'layout/phantom_phone.json'), 'utf8');
    const json = JSON.parse(raw);
    const result = validateLayoutIR(json);
    expect(result.success).toBe(true);
  });

  it('should validate and parse Timeline IR fixture successfully', () => {
    const raw = readFileSync(join(FIXTURES_DIR, 'timeline/phantom_phone.json'), 'utf8');
    const json = JSON.parse(raw);
    const result = validateTimelineIR(json);
    expect(result.success).toBe(true);
  });
});
