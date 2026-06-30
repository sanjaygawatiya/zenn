import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { validateStoryboardIR, StoryboardIR } from './core/ir/storyboard.js';
import { PipelineRunner } from './core/compiler/runner.js';
import { MotionCanvasAdapter } from './core/adapter/motion_canvas.js';
import { computeFingerprint } from './core/utils/hash.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function findFfprobePath(): string {
  try {
    execSync('ffprobe -version', { stdio: 'ignore' });
    return 'ffprobe';
  } catch {}
  const pythonFfprobe = 'C:/Users/sanja/AppData/Local/Programs/Python/Python314/Lib/site-packages/static_ffmpeg/bin/win32/ffprobe.exe';
  if (existsSync(pythonFfprobe)) {
    return pythonFfprobe;
  }
  throw new Error('FFprobe executable not found.');
}

function findFfmpegPath(): string {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return 'ffmpeg';
  } catch {}
  const pythonFfmpeg = 'C:/Users/sanja/AppData/Local/Programs/Python/Python314/Lib/site-packages/static_ffmpeg/bin/win32/ffmpeg.exe';
  if (existsSync(pythonFfmpeg)) {
    return pythonFfmpeg;
  }
  throw new Error('FFmpeg executable not found.');
}

async function main() {
  const refVideo = process.argv[2];
  const transcriptPath = process.argv[3];
  const outDir = process.argv[4] || './workspace_out';

  if (!refVideo || !transcriptPath) {
    console.error('Usage: node run_engine.js <reference_video> <transcript_path> [output_directory]');
    process.exit(1);
  }

  console.log('--- STARTING REUSABLE VIDEO GENERATION ENGINE ---');
  console.log(`Reference Video: ${refVideo}`);
  console.log(`Transcript: ${transcriptPath}`);
  console.log(`Output Workspace: ${outDir}`);

  // Create workspace directories
  mkdirSync(outDir, { recursive: true });
  mkdirSync(join(outDir, 'audio'), { recursive: true });
  mkdirSync(join(outDir, 'assets'), { recursive: true });

  const ffprobePath = findFfprobePath();
  const ffmpegPath = findFfmpegPath();

  // 1. Analyze the Reference Video
  console.log('Analyzing reference video metadata...');
  const analysisCmd = `"${ffprobePath}" -v quiet -print_format json -show_format -show_streams "${refVideo}"`;
  const analysisOutput = execSync(analysisCmd).toString();
  const analysisPath = join(outDir, 'reference_analysis.json');
  writeFileSync(analysisPath, analysisOutput, 'utf8');
  console.log(`Video analysis metadata written to: ${analysisPath}`);

  // 2. Parse Transcript into script lines
  console.log('Parsing transcript lines...');
  const rawTranscript = readFileSync(transcriptPath, 'utf8');
  const lines = rawTranscript
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0)
    // Strip timestamps (e.g. 00:00:05 or [00:00:05]) if present
    .map(l => l.replace(/^\[?\d{2}:\d{2}:\d{2}(\.\d{3})?\]?\s*/, '').trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    console.error('Transcript contains no valid script lines.');
    process.exit(1);
  }
  console.log(`Parsed ${lines.length} scenes from transcript.`);

  // 3. Generate voice narration via EdgeTTS and measure durations
  const scenes = [];
  let cumulativeTimeMs = 0;

  for (let i = 0; i < lines.length; i++) {
    const text = lines[i] as string;
    const pad = String(i + 1).padStart(3, '0');
    const tempMp3 = join(outDir, `audio/temp_${pad}.mp3`);
    const wavPath = join(outDir, `audio/narration_${pad}.wav`);

    console.log(`[Scene ${i + 1}/${lines.length}] Generating TTS narration for: "${text}"`);

    // Call edge-tts CLI tool
    const ttsCmd = `edge-tts --text "${text.replace(/"/g, '\\"')}" --write-media "${tempMp3}" --voice "en-US-ChristopherNeural"`;
    execSync(ttsCmd, { stdio: 'inherit' });

    // Convert MP3 to PCM WAV (mono, 44.1kHz) matching pipeline requirements
    const convertCmd = `"${ffmpegPath}" -y -i "${tempMp3}" -acodec pcm_s16le -ac 1 -ar 44100 "${wavPath}"`;
    execSync(convertCmd, { stdio: 'ignore' });

    // Measure WAV duration
    const durationCmd = `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${wavPath}"`;
    const durationSec = parseFloat(execSync(durationCmd).toString().trim());
    const durationMs = Math.round(durationSec * 1000);

    console.log(`- Narration Audio Duration: ${durationMs} ms`);

    scenes.push({
      sceneId: `SCN-000${i + 1}`,
      objective: `Visualize conceptual message of sentence ${i + 1}`,
      rawScript: text,
      assets: [
        {
          assetId: `subject_000${i + 1}`,
          type: 'NODE' as const,
          role: 'primary_subject' as const,
          style: 'solid',
          mustRemainVisible: true,
        },
        {
          assetId: `caption_000${i + 1}`,
          type: 'TXT' as const,
          role: 'label' as const,
          style: 'subtitle',
          mustRemainVisible: true,
        }
      ],
      timingOffsetMs: cumulativeTimeMs,
      durationMs,
    });

    cumulativeTimeMs += durationMs;
  }

  // 4. Build and validate Storyboard IR
  const rawContent = {
    id: 'STB-GENERIC',
    version: '1.0',
    compilerVersion: '1.0.0',
    createdAt: new Date().toISOString(),
    scenes,
  };
  const fingerprint = computeFingerprint(rawContent);
  const storyboardData: StoryboardIR = {
    ...rawContent,
    fingerprint,
  };

  const validation = validateStoryboardIR(storyboardData);
  if (!validation.success) {
    console.error('Generated Storyboard failed validation:', validation.errors);
    process.exit(1);
  }

  const storyboard = validation.data;
  const storyboardJsonPath = join(outDir, 'storyboard.json');
  writeFileSync(storyboardJsonPath, JSON.stringify(storyboard, null, 2), 'utf8');
  console.log(`Generated storyboard.json written to: ${storyboardJsonPath}`);

  // 5. Copy reference audio assets (ambient hum, background music, etc.) to the output workspace
  const srcAudioDir = join(process.cwd(), 'tmp/audio');
  const destAudioDir = join(outDir, 'audio');
  
  const referenceAssets = ['ambient_hum.wav', 'music_background.wav', 'sfx_whoosh.wav', 'sfx_vibration.wav'];
  for (const asset of referenceAssets) {
    const srcPath = join(srcAudioDir, asset);
    const destPath = join(destAudioDir, asset);
    if (existsSync(srcPath)) {
      copyFileSync(srcPath, destPath);
    }
  }

  // 6. Run compiler passes
  console.log('Compiling storyboard IR into execution pipeline representations...');
  const pipelineResult = PipelineRunner.run(storyboard);
  if (!pipelineResult.success) {
    console.error('Compiler pipeline failed:', pipelineResult.errors);
    process.exit(1);
  }

  console.log(`Compilation complete: resolution=${pipelineResult.render?.resolution.width}x${pipelineResult.render?.resolution.height}, duration=${pipelineResult.timeline?.masterClockMs} ms`);

  // 7. Render final video using the MotionCanvasAdapter
  if (pipelineResult.render && pipelineResult.audio && pipelineResult.timeline) {
    const outputVideoPath = join(outDir, 'output.mp4');
    console.log(`Rendering final video to: ${outputVideoPath}`);

    const adapter = new MotionCanvasAdapter();
    const renderResult = await adapter.render(
      pipelineResult.render,
      pipelineResult.audio,
      outputVideoPath,
      outDir,
      pipelineResult.timeline
    );

    if (!renderResult.success) {
      console.error('Rendering failed:', renderResult.errors);
      process.exit(1);
    }

    console.log('--- REUSABLE VIDEO GENERATION ENGINE RUN COMPLETED SUCCESSFULLY ---');
    console.log(`Final output video saved to: ${outputVideoPath}`);
    console.log(`Diagnostics:`, renderResult.data.diagnostics);
  } else {
    console.error('Missing render, audio, or timeline IR from compiled pipeline result.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal engine runner error:', err);
  process.exit(1);
});
