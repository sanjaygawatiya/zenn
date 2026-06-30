import { StoryboardIR } from '../ir/storyboard.js';
import { LayoutIR } from '../ir/layout.js';
import { TimelineIR } from '../ir/timeline.js';
import { CameraIR } from '../ir/camera.js';
import { MotionIR } from '../ir/motion.js';
import { RenderIR } from '../ir/render.js';
import { AudioIR } from '../ir/audio.js';
import { CompilerContext, createDefaultContext } from './context.js';
import { StoryboardToLayoutCompiler } from './storyboard_to_layout.js';
import { LayoutToTimelineCompiler } from './layout_to_timeline.js';
import { TimelineToCameraCompiler } from './timeline_to_camera.js';
import { CameraToMotionCompiler } from './camera_to_motion.js';
import { MotionToRenderCompiler } from './motion_to_render.js';
import { StoryboardToAudioCompiler } from './storyboard_to_audio.js';

export interface PipelineResult {
  readonly success: boolean;
  readonly layout?: LayoutIR;
  readonly timeline?: TimelineIR;
  readonly camera?: CameraIR;
  readonly motion?: MotionIR;
  readonly render?: RenderIR;
  readonly audio?: AudioIR;
  readonly errors: string[];
  readonly durationMs: number;
}

export class PipelineRunner {
  static run(storyboard: StoryboardIR, context: CompilerContext = createDefaultContext()): PipelineResult {
    const startTime = Date.now();

    // Pass 1: Storyboard -> Layout
    const layoutRes = StoryboardToLayoutCompiler.compile(context, storyboard);
    if (!layoutRes.success) {
      return { success: false, errors: layoutRes.errors, durationMs: Date.now() - startTime };
    }
    const layout = layoutRes.data;

    // Pass 2: Layout -> Timeline
    const timelineCompiler = new LayoutToTimelineCompiler();
    const timelineRes = timelineCompiler.compile({ storyboard, layout }, context);
    if (!timelineRes.success) {
      return { success: false, errors: timelineRes.errors.map(e => e.message), durationMs: Date.now() - startTime };
    }
    const timeline = timelineRes.data;

    // Pass 3: Timeline -> Camera
    const cameraCompiler = new TimelineToCameraCompiler();
    const cameraRes = cameraCompiler.compile({ storyboard, layout, timeline }, context);
    if (!cameraRes.success) {
      return { success: false, errors: cameraRes.errors.map(e => e.message), durationMs: Date.now() - startTime };
    }
    const camera = cameraRes.data;

    // Pass 4: Camera -> Motion
    const motionCompiler = new CameraToMotionCompiler();
    const motionRes = motionCompiler.compile({ storyboard, layout, timeline, camera }, context);
    if (!motionRes.success) {
      return { success: false, errors: motionRes.errors.map(e => e.message), durationMs: Date.now() - startTime };
    }
    const motion = motionRes.data;

    // Pass 5: Motion -> Render
    const renderCompiler = new MotionToRenderCompiler();
    const renderRes = renderCompiler.compile({ storyboard, layout, timeline, camera, motion }, context);
    if (!renderRes.success) {
      return { success: false, errors: renderRes.errors.map(e => e.message), durationMs: Date.now() - startTime };
    }
    const render = renderRes.data;

    // Pass 6: Storyboard -> Audio
    const audioCompiler = new StoryboardToAudioCompiler();
    const audioRes = audioCompiler.compile({ storyboard, timeline }, context);
    if (!audioRes.success) {
      return { success: false, errors: audioRes.errors.map(e => e.message), durationMs: Date.now() - startTime };
    }
    const audio = audioRes.data;

    return {
      success: true,
      layout,
      timeline,
      camera,
      motion,
      render,
      audio,
      errors: [],
      durationMs: Date.now() - startTime,
    };
  }
}
