import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateStoryboardIR } from '../ir/storyboard.js';
import { StoryboardToLayoutCompiler } from '../compiler/storyboard_to_layout.js';
import { LayoutToTimelineCompiler } from '../compiler/layout_to_timeline.js';
import { TimelineToCameraCompiler } from '../compiler/timeline_to_camera.js';
import { CameraToMotionCompiler } from '../compiler/camera_to_motion.js';
import { MotionToRenderCompiler } from '../compiler/motion_to_render.js';
import { StoryboardToAudioCompiler } from '../compiler/storyboard_to_audio.js';
import { MotionCanvasAdapter } from '../adapter/motion_canvas.js';
import { createDefaultContext } from '../compiler/context.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ARTIFACT_DIR = 'C:/Users/sanja/.gemini/antigravity/brain/3f1414f9-dd29-4405-bb17-846af36634b8';

async function main() {
  console.log('Running Mutation Test...');
  const stbPath = join(process.cwd(), 'src/fixtures/storyboard/phantom_phone.json');
  const stbData = validateStoryboardIR(JSON.parse(readFileSync(stbPath, 'utf8')));

  if (!stbData.success) {
    console.error('Failed to parse Storyboard IR:', stbData.errors);
    return;
  }

  const context = createDefaultContext();

  const layoutRes = StoryboardToLayoutCompiler.compile(context, stbData.data);
  if (!layoutRes.success) {
    console.error('Layout compilation failed:', layoutRes.errors);
    return;
  }

  const layout = layoutRes.data;

  // Print baseline coordinates
  const phoneAsset = layout.layoutAssets.find(a => a.assetId === 'phone_body');
  if (phoneAsset) {
    console.log(`Original Phone Coordinates: ${phoneAsset.centerX} ${phoneAsset.centerY}`);
  }

  // Compile layout-to-timeline
  const timelineCompiler = new LayoutToTimelineCompiler();
  const timelineRes = timelineCompiler.compile({ storyboard: stbData.data, layout }, context);
  if (!timelineRes.success) {
    console.error('Timeline compilation failed:', timelineRes.errors);
    return;
  }
  const timeline = timelineRes.data;

  // Compile timeline-to-camera
  const cameraCompiler = new TimelineToCameraCompiler();
  const cameraRes = cameraCompiler.compile({ storyboard: stbData.data, layout, timeline }, context);
  if (!cameraRes.success) {
    console.error('Camera compilation failed:', cameraRes.errors);
    return;
  }
  const camera = cameraRes.data;

  // Compile camera-to-motion
  const motionCompiler = new CameraToMotionCompiler();
  const motionRes = motionCompiler.compile({ storyboard: stbData.data, layout, timeline, camera }, context);
  if (!motionRes.success) {
    console.error('Motion compilation failed:', motionRes.errors);
    return;
  }
  const motion = motionRes.data;

  // MUTATION: Mutate the physical coordinate of the phone asset in Layout IR before Render Pass
  const mutatedLayout = {
    ...layout,
    layoutAssets: layout.layoutAssets.map(asset => {
      if (asset.assetId === 'phone_body') {
        return {
          ...asset,
          centerX: 0.8, // Mutate from 0.5 to 0.8
          centerY: 0.2, // Mutate from 0.5 to 0.2
        };
      }
      return asset;
    }),
  };

  const mutatedPhoneAsset = mutatedLayout.layoutAssets.find(a => a.assetId === 'phone_body');
  if (mutatedPhoneAsset) {
    console.log(`Mutated Phone Coordinates: ${mutatedPhoneAsset.centerX} ${mutatedPhoneAsset.centerY}`);
  }

  // Compile Motion-to-Render using mutated layout
  const renderCompiler = new MotionToRenderCompiler();
  const renderRes = renderCompiler.compile({ storyboard: stbData.data, layout: mutatedLayout, timeline, camera, motion }, context);
  if (!renderRes.success) {
    console.error('Render compilation failed:', renderRes.errors);
    return;
  }
  const render = renderRes.data;

  // Compile Storyboard-to-Audio
  const audioCompiler = new StoryboardToAudioCompiler();
  const audioRes = audioCompiler.compile({ storyboard: stbData.data, timeline }, context);
  if (!audioRes.success) {
    console.error('Audio compilation failed:', audioRes.errors);
    return;
  }
  const audio = audioRes.data;

  const renderPath = join(ARTIFACT_DIR, 'mutated_render_ir.json');
  writeFileSync(renderPath, JSON.stringify(render, null, 2));
  console.log(`Saved Mutated RenderIR to ${renderPath}`);

  const adapter = new MotionCanvasAdapter();
  const outputVideoPath = join(ARTIFACT_DIR, 'output_mutated.mp4');
  const renderResult = await adapter.render(render, audio, outputVideoPath, './tmp_mutated');

  if (renderResult.success) {
    console.log(`Mutated video rendered successfully and saved to ${outputVideoPath}`);
  }
}

main().catch(err => {
  console.error(err);
});
