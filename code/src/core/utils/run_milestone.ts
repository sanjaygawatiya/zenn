import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateStoryboardIR, StoryboardIR, StoryboardScene } from '../ir/storyboard.js';
import { PipelineRunner } from '../compiler/runner.js';
import { MotionCanvasAdapter } from '../adapter/motion_canvas.js';
import { createDefaultContext } from '../compiler/context.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ARTIFACT_DIR = 'C:/Users/sanja/.gemini/antigravity/brain/3f1414f9-dd29-4405-bb17-846af36634b8';

function parseTranscriptToScenes(rawText: string): StoryboardScene[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const parsedLines: { ms: number; text: string }[] = [];

  for (const line of lines) {
    const match = line.match(/^(\d{2}):(\d{2}):(\d{2})\s+(.+)$/);
    if (match) {
      const hrs = parseInt(match[1] || '0');
      const mins = parseInt(match[2] || '0');
      const secs = parseInt(match[3] || '0');
      const ms = ((hrs * 60 + mins) * 60 + secs) * 1000;
      const text = match[4] || '';
      parsedLines.push({ ms, text });
    }
  }

  // Sort lines chronologically just in case
  parsedLines.sort((a, b) => a.ms - b.ms);

  const scenes: StoryboardScene[] = [];
  for (let i = 0; i < parsedLines.length; i++) {
    const current = parsedLines[i];
    const next = parsedLines[i + 1];
    if (!current) continue;

    // Use next line's timestamp to compute duration. If it's the last line, default to 4000ms.
    const durationMs = next ? (next.ms - current.ms) : 4000;

    scenes.push({
      sceneId: `SCN-${String(i + 1).padStart(4, '0')}`,
      objective: `Compile scene ${i + 1}`,
      rawScript: current.text.toUpperCase(),
      timingOffsetMs: current.ms,
      durationMs: durationMs <= 0 ? 1000 : durationMs,
      assets: [
        {
          assetId: "room_light",
          type: "SVG",
          role: "primary_subject",
          style: "flat_vector",
          mustRemainVisible: true
        }
      ]
    });
  }
  return scenes;
}

async function main() {
  console.log('Running Milestone M1 Compilation...');
  
  const transcriptPath = 'd:/my_stuff/zenn/reference/templates/trascript.txt';
  if (!existsSync(transcriptPath)) {
    console.error(`Transcript file not found at ${transcriptPath}`);
    return;
  }

  const rawTranscript = readFileSync(transcriptPath, 'utf8');
  const parsedScenes = parseTranscriptToScenes(rawTranscript);

  const stb: StoryboardIR = {
    id: "STB-HUMANS-001",
    version: "1.0",
    compilerVersion: "1.0.0",
    createdAt: new Date().toISOString(),
    fingerprint: "humans_full_fingerprint_v1",
    scenes: parsedScenes
  };

  const stbData = validateStoryboardIR(stb);
  if (!stbData.success) {
    console.error('Failed to parse Storyboard IR:', stbData.errors);
    return;
  }

  const context = createDefaultContext();
  const pipelineResult = PipelineRunner.run(stbData.data, context);

  if (!pipelineResult.success) {
    console.error('Pipeline compilation failed:', pipelineResult.errors);
    return;
  }

  console.log('Pipeline compiled successfully!');
  
  const renderPath = join(ARTIFACT_DIR, 'generated_render_ir.json');
  const audioPath = join(ARTIFACT_DIR, 'generated_audio_ir.json');

  writeFileSync(renderPath, JSON.stringify(pipelineResult.render, null, 2));
  writeFileSync(audioPath, JSON.stringify(pipelineResult.audio, null, 2));
  console.log(`Saved RenderIR to ${renderPath}`);
  console.log(`Saved AudioIR to ${audioPath}`);

  const adapter = new MotionCanvasAdapter();
  const outputVideoPath = join(ARTIFACT_DIR, 'output.mp4');
  
  console.log('Rendering video frames and muxing audio streams...');
  const renderResult = await adapter.render(pipelineResult.render!, pipelineResult.audio!, outputVideoPath);

  if (renderResult.success) {
    console.log(`Video rendered successfully and saved to ${outputVideoPath}`);
    
    if (existsSync('./tmp/adapter_capability.json')) {
      copyFileSync('./tmp/adapter_capability.json', join(ARTIFACT_DIR, 'adapter_capability.json'));
    }
    if (existsSync('./tmp/adapter_diagnostics.json')) {
      copyFileSync('./tmp/adapter_diagnostics.json', join(ARTIFACT_DIR, 'adapter_diagnostics.json'));
    }
  } else {
    console.error('Rendering failed:', (renderResult as any).errors);
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
});
