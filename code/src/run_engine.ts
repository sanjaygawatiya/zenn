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

  // Read reference scene durations and visual themes for pacing alignment
  let refDurations: number[] = [];
  let refScenes: any[] = [];
  if (existsSync(segmentationPath)) {
    const segData = JSON.parse(readFileSync(segmentationPath, 'utf8'));
    refDurations = segData.sceneDurations || [];
    refScenes = segData.scenes || [];
  }

  // 2. Parse Transcript into script lines
  console.log('Parsing transcript lines...');
  const rawTranscript = readFileSync(transcriptPath, 'utf8');
  let lines = rawTranscript
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

  if (refDurations.length > 0 && lines.length > refDurations.length) {
    console.log(`Capping transcript lines from ${lines.length} to match reference scenes count: ${refDurations.length}`);
    lines = lines.slice(0, refDurations.length);
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

    if (existsSync(wavPath)) {
      console.log(`[Scene ${i + 1}/${lines.length}] Using cached TTS narration for: "${text}"`);
    } else {
      // Call edge-tts CLI tool
      const ttsCmd = `edge-tts --text "${text.replace(/"/g, '\\"')}" --write-media "${tempMp3}" --voice "en-US-ChristopherNeural"`;
      execSync(ttsCmd, { stdio: 'inherit' });

      // Convert MP3 to PCM WAV (mono, 44.1kHz) matching pipeline requirements
      const convertCmd = `"${ffmpegPath}" -y -i "${tempMp3}" -acodec pcm_s16le -ac 1 -ar 44100 "${wavPath}"`;
      execSync(convertCmd, { stdio: 'ignore' });
    }

    // Measure WAV duration
    const durationCmd = `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${wavPath}"`;
    const durationSec = parseFloat(execSync(durationCmd).toString().trim());
    const durationMs = Math.round(durationSec * 1000);

    // Derive pacing from reference video cuts: lock to reference duration exactly if present
    const refDurationVal = refDurations[i];
    const refSceneDurMs = refDurationVal !== undefined ? Math.round(refDurationVal * 1000) : 0;
    const finalSceneDurMs = refSceneDurMs > 0 ? refSceneDurMs : Math.max(1000, durationMs);

    const activeRefScene = refScenes[i] || {};
    const bgColor = activeRefScene.backgroundColor || '#151520';
    const primaryColor = activeRefScene.primaryColor || '#00a8ff';

    console.log(`- Scene Duration resolved: ${finalSceneDurMs} ms (ref: ${refSceneDurMs} ms, audio: ${durationMs} ms)`);

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
      timingOffsetMs: cumulativeTimeMs,
      durationMs: finalSceneDurMs,
    });

    cumulativeTimeMs += finalSceneDurMs;
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

    // 8. Pad and Concatenate EdgeTTS narration segments to match scene pacing
    console.log('Padding narration segments to match scene durations...');
    const paddedFiles: string[] = [];
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]!;
      const pad = String(i + 1).padStart(3, '0');
      const wavPath = join(outDir, `audio/narration_${pad}.wav`);
      const paddedWavPath = join(outDir, `audio/padded_${pad}.wav`);
      
      const targetDurationSec = scene.durationMs / 1000.0;
      const padCmd = `"${ffmpegPath}" -y -i "${wavPath}" -af "apad" -t ${targetDurationSec} "${paddedWavPath}"`;
      execSync(padCmd, { stdio: 'ignore' });
      paddedFiles.push(paddedWavPath);
    }

    const audioListPath = join(outDir, 'audio_list.txt');
    const listContent = paddedFiles.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
    writeFileSync(audioListPath, listContent, 'utf8');

    const masterAudioPath = join(outDir, 'audio_master.wav');
    console.log('Concatenating padded audio segments into a master narration track...');
    const concatCmd = `"${ffmpegPath}" -y -f concat -safe 0 -i "${audioListPath}" -c copy "${masterAudioPath}"`;
    execSync(concatCmd, { stdio: 'ignore' });

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
