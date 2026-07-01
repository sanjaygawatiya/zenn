import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, unlinkSync, renameSync } from 'node:fs';
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
  const outDir = join(process.cwd(), process.argv[4] || './workspace_out');

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

  // 1. Analyze the Reference Video (Metadata, Segmentation, Pacing & Keyframe Extraction)
  console.log('Analyzing reference video metadata...');
  const analysisCmd = `"${ffprobePath}" -v quiet -print_format json -show_format -show_streams "${refVideo}"`;
  const analysisOutput = execSync(analysisCmd).toString();
  const analysisPath = join(outDir, 'reference_analysis.json');
  writeFileSync(analysisPath, analysisOutput, 'utf8');
  console.log(`Video analysis metadata written to: ${analysisPath}`);

  console.log('Running deep scene segmentation & reference keyframe extraction...');
  const segmentationPath = join(outDir, 'reference_segmentation.json');
  const segmentCmd = `python src/core/utils/analyze_reference.py "${refVideo}" "${outDir}"`;
  execSync(segmentCmd, { stdio: 'inherit' });

  console.log('Processing reference keyframes into pencil sketch outlines...');
  const sketchCmd = `python src/core/utils/pencil_sketch.py "${outDir}"`;
  execSync(sketchCmd, { stdio: 'inherit' });

  // Read reference scene durations and visual themes for pacing alignment
  let refDurations: number[] = [];
  let refScenes: any[] = [];
  if (existsSync(segmentationPath)) {
    const segData = JSON.parse(readFileSync(segmentationPath, 'utf8'));
    refDurations = segData.sceneDurations || [];
    refScenes = segData.scenes || [];
  }

  // 2. Parse Transcript into script lines with timestamps
  console.log('Parsing transcript lines...');
  const rawTranscript = readFileSync(transcriptPath, 'utf8');
  const rawLines = rawTranscript.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const parsedLines: { ms: number; text: string }[] = [];

  for (const line of rawLines) {
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

  if (parsedLines.length === 0) {
    console.error('Transcript contains no valid script lines with timestamps.');
    process.exit(1);
  }
  console.log(`Parsed ${parsedLines.length} scenes from transcript.`);

  // 3. Get total video duration from reference video
  let totalDurMs = 511767;
  if (existsSync(segmentationPath)) {
    const segData = JSON.parse(readFileSync(segmentationPath, 'utf8'));
    if (segData.totalDurationSec) {
      totalDurMs = Math.round(segData.totalDurationSec * 1000);
    }
  }

  // 4. Generate voice narration via EdgeTTS and build scenes
  const scenes = [];
  for (let i = 0; i < parsedLines.length; i++) {
    const current = parsedLines[i]!;
    const next = parsedLines[i + 1];
    
    // Duration is next timestamp minus current timestamp
    let finalSceneDurMs = next ? (next.ms - current.ms) : (totalDurMs - current.ms);
    if (finalSceneDurMs <= 0) {
      finalSceneDurMs = 2000; // default fallback
    }

    const text = current.text;
    const pad = String(i + 1).padStart(3, '0');
    const tempMp3 = join(outDir, `audio/temp_${pad}.mp3`);
    const wavPath = join(outDir, `audio/narration_${pad}.wav`);

    if (existsSync(wavPath)) {
      console.log(`[Scene ${i + 1}/${parsedLines.length}] Using cached TTS narration for: "${text}"`);
    } else {
      console.log(`[Scene ${i + 1}/${parsedLines.length}] Generating TTS narration for: "${text}"`);
      // Call edge-tts CLI tool
      const ttsCmd = `edge-tts --text "${text.replace(/"/g, '\\"')}" --write-media "${tempMp3}" --voice "en-US-ChristopherNeural"`;
      execSync(ttsCmd, { stdio: 'inherit' });

      // Convert MP3 to PCM WAV (mono, 44.1kHz) matching pipeline requirements
      const convertCmd = `"${ffmpegPath}" -y -i "${tempMp3}" -acodec pcm_s16le -ac 1 -ar 44100 "${wavPath}"`;
      execSync(convertCmd, { stdio: 'ignore' });
    }

    // Resolve color styles using reference segmentation at the scene's starting timestamp
    let bgColor = '#151520';
    let primaryColor = '#00a8ff';
    if (refScenes.length > 0) {
      const activeRef = [...refScenes].reverse().find(s => s.timestampSec <= current.ms / 1000.0);
      if (activeRef) {
        bgColor = activeRef.backgroundColor || bgColor;
        primaryColor = activeRef.primaryColor || primaryColor;
      }
    }

    scenes.push({
      sceneId: `SCN-${String(i + 1).padStart(4, '0')}`,
      objective: `Visualize conceptual message of sentence ${i + 1}`,
      rawScript: text,
      assets: [
        {
          assetId: `bg_000${i + 1}`,
          type: 'NODE' as const,
          role: 'background' as const,
          style: bgColor,
          mustRemainVisible: true,
        },
        {
          assetId: `subject_000${i + 1}`,
          type: 'NODE' as const,
          role: 'primary_subject' as const,
          style: primaryColor,
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
      timingOffsetMs: current.ms,
      durationMs: finalSceneDurMs,
    });
  }

  // 5. Build and validate Storyboard IR
  const rawContent = {
    id: 'STB-HUMANS-001',
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

    // 8. Mix EdgeTTS narration segments at their exact timestamps
    console.log('Mixing narration segments into a master narration track...');
    const masterAudioPath = join(outDir, 'audio_master.wav');
    const mixAudioCmd = `python src/core/utils/mix_narration.py "${outDir}" "${masterAudioPath}" "${storyboardJsonPath}"`;
    execSync(mixAudioCmd, { stdio: 'inherit' });

    // 9. Mux master narration track into final video
    const finalMixedPath = join(outDir, 'output_mixed.mp4');
    console.log('Muxing master narration track into final video...');
    const mixCmd = `"${ffmpegPath}" -y -i "${outputVideoPath}" -i "${masterAudioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 "${finalMixedPath}"`;
    execSync(mixCmd, { stdio: 'ignore' });

    // Overwrite the original output.mp4 with the mixed version
    unlinkSync(outputVideoPath);
    renameSync(finalMixedPath, outputVideoPath);

    // 8. Run visual similarity scoring
    console.log('Running visual similarity scoring...');
    const similarityReportPath = join(outDir, 'similarity_report.json');
    const similarityCmd = `python src/core/utils/similarity_validator.py "${outDir}" "${outputVideoPath}" "${segmentationPath}" "${similarityReportPath}"`;
    execSync(similarityCmd, { stdio: 'inherit' });
    console.log(`Similarity report written to: ${similarityReportPath}`);

    // Enforce similarity threshold gate
    if (existsSync(similarityReportPath)) {
      const report = JSON.parse(readFileSync(similarityReportPath, 'utf8'));
      const avgSimilarity = report.averageSimilarityPercent || 0;
      const threshold = parseFloat(process.env['SIMILARITY_THRESHOLD'] || '50.0');
      console.log(`Similarity Validation: average=${avgSimilarity}%, threshold=${threshold}%`);
      if (avgSimilarity < threshold) {
        console.error(`ERROR: Visual similarity score ${avgSimilarity}% is below the required threshold of ${threshold}%!`);
        process.exit(1);
      }
      console.log('Visual similarity validation check PASSED!');
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
