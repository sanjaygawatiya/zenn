import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateStoryboardIR } from './core/ir/storyboard.js';
import { PipelineRunner } from './core/compiler/runner.js';
import { MotionCanvasAdapter } from './core/adapter/motion_canvas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = join(process.cwd(), 'src/fixtures');

async function main() {
  console.log('--- STARTING VIDEO CREATION CYCLE ---');
  
  // 1. Read the Storyboard IR
  const storyboardPath = join(FIXTURES_DIR, 'storyboard/ancient_humans.json');
  console.log(`Reading storyboard from: ${storyboardPath}`);
  
  if (!existsSync(storyboardPath)) {
    console.error(`Storyboard file not found at: ${storyboardPath}`);
    process.exit(1);
  }
  
  const rawStb = readFileSync(storyboardPath, 'utf8');
  const stbResult = validateStoryboardIR(JSON.parse(rawStb));
  
  if (!stbResult.success) {
    console.error('Storyboard validation failed:', stbResult.errors);
    process.exit(1);
  }
  
  const storyboard = stbResult.data;
  console.log(`Storyboard validated successfully: ${storyboard.id} (${storyboard.scenes.length} scenes)`);
  
  // 2. Run the Compiler Pipeline
  console.log('Running compiler passes...');
  const pipelineResult = PipelineRunner.run(storyboard);
  
  if (!pipelineResult.success) {
    console.error('Pipeline compilation failed:', pipelineResult.errors);
    process.exit(1);
  }
  
  console.log('Pipeline compiled successfully!');
  console.log(`- Layout ID: ${pipelineResult.layout?.id}`);
  console.log(`- Timeline Duration: ${pipelineResult.timeline?.masterClockMs} ms`);
  console.log(`- Camera Keyframes: ${pipelineResult.camera?.cameraProgram.length}`);
  console.log(`- Motion Keyframes: ${pipelineResult.motion?.motionProgram.length} assets`);
  console.log(`- Total Render Frames: ${pipelineResult.render?.totalFrames} (${pipelineResult.render?.fps} fps)`);
  
  // 3. Render video using MotionCanvasAdapter
  if (pipelineResult.render && pipelineResult.audio) {
    console.log('Rendering video to output_humans.mp4...');
    const adapter = new MotionCanvasAdapter();
    const outputPath = './output_humans.mp4';
    
    const renderResult = await adapter.render(
      pipelineResult.render,
      pipelineResult.audio,
      outputPath
    );
    
    if (!renderResult.success) {
      console.error('Rendering failed:', renderResult.errors);
      process.exit(1);
    }
    
    console.log('--- VIDEO CREATION CYCLE COMPLETED SUCCESSFULLY ---');
    console.log(`Video saved to: ${outputPath}`);
    console.log(`Diagnostics:`, renderResult.data.diagnostics);
  } else {
    console.error('Render or Audio IR is missing from compiler output.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error in pipeline runner script:', err);
  process.exit(1);
});
