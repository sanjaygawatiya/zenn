import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CODE_DIR = join(__dirname, '../..');

describe('Engine Helper Scripts Integration Tests', () => {
  it('should run analyze_reference.py to extract visual themes and cuts', () => {
    const pythonScript = join(CODE_DIR, 'src/core/utils/analyze_reference.py');
    const refVideo = join(CODE_DIR, '../reference/templates/What Did Ancient Humans Do at Night _1080p.mp4');
    const outDir = join(CODE_DIR, 'workspace_test_fixture');

    if (existsSync(refVideo)) {
      const cmd = `python "${pythonScript}" "${refVideo}" "${outDir}"`;
      expect(() => execSync(cmd, { stdio: 'ignore' })).not.toThrow();

      const segPath = join(outDir, 'reference_segmentation.json');
      expect(existsSync(segPath)).toBe(true);

      const data = JSON.parse(readFileSync(segPath, 'utf8'));
      expect(data.success).toBe(true);
      expect(data.scenes).toBeDefined();
      expect(data.scenes.length).toBeGreaterThan(0);
      expect(data.scenes[0].backgroundColor).toBeDefined();
      expect(data.scenes[0].primaryColor).toBeDefined();
    }
  });

  it('should run similarity_validator.py to perform NCC and downsampled cosine similarity', () => {
    const pythonScript = join(CODE_DIR, 'src/core/utils/similarity_validator.py');
    const refDir = join(CODE_DIR, 'workspace_test_fixture');
    const segPath = join(CODE_DIR, 'workspace_test_fixture/reference_segmentation.json');
    const outJson = join(CODE_DIR, 'workspace_test_fixture/similarity_report_test.json');

    if (existsSync(segPath)) {
      const refVideo = join(CODE_DIR, '../reference/templates/What Did Ancient Humans Do at Night _1080p.mp4');
      const cmd = `python "${pythonScript}" "${refDir}" "${refVideo}" "${segPath}" "${outJson}"`;
      expect(() => execSync(cmd, { stdio: 'ignore' })).not.toThrow();

      expect(existsSync(outJson)).toBe(true);
      const report = JSON.parse(readFileSync(outJson, 'utf8'));
      expect(report.success).toBe(true);
      expect(report.averageSimilarityPercent).toBeGreaterThan(50.0);
    }
  });
});
