import { StoryboardIR } from '../ir/storyboard.js';
import { LayoutIR } from '../ir/layout.js';
import { TimelineIR } from '../ir/timeline.js';
import { CameraIR } from '../ir/camera.js';
import { MotionIR } from '../ir/motion.js';
import { RenderIR, AssetRenderBlock } from '../ir/render.js';
import { RenderBuilder } from '../builders/render.js';
import { CompilerContext } from './context.js';
import { Result } from '../utils/result.js';
import { deepFreeze } from '../utils/freeze.js';
import { CompilerPass } from './pass.js';
import { CompilerError } from '../utils/errors.js';

export interface MotionToRenderInput {
  readonly storyboard: StoryboardIR;
  readonly layout: LayoutIR;
  readonly timeline: TimelineIR;
  readonly camera: CameraIR;
  readonly motion: MotionIR;
}

export class MotionToRenderCompiler implements CompilerPass<MotionToRenderInput, RenderIR> {
  readonly id = 'CP-005';
  readonly version = '1.0';

  compile(
    input: Readonly<MotionToRenderInput>,
    context: CompilerContext
  ): Result<Readonly<RenderIR>, CompilerError[]> {
    const startTime = Date.now();
    context.metrics.increment('CP-005-Runs');

    const storyboard = input.storyboard;
    const layout = input.layout;
    const timeline = input.timeline;
    const camera = input.camera;

    const width = 1920;
    const height = 1080;
    const fps = 30;
    const totalFrames = Math.round(timeline.masterClockMs * fps / 1000);

    const builder = new RenderBuilder()
      .id(`RND-${storyboard.id}`)
      .resolution(width, height)
      .fps(fps)
      .totalFrames(totalFrames);

    const assetsRenderBlocks: AssetRenderBlock[] = [];
    for (const asset of layout.layoutAssets) {
      const baseValX = asset.centerX * width;
      const baseValY = asset.centerY * height;

      const keyframes: any[] = [];
      const programs = input.motion.motionProgram.filter(p => p.targetAssetId === asset.assetId);

      for (const p of programs) {
        const startFrame = Math.round(p.startMs * fps / 1000);
        const endFrame = Math.round((p.startMs + p.durationMs) * fps / 1000);

        if (p.intentToken === 'ENTER') {
          keyframes.push({
            frame: startFrame,
            transform: { x: baseValX, y: baseValY + 200, scaleX: 0.5, scaleY: 0.5, rotation: 0, opacity: 0.0 },
            bezier: [0.25, 1.0, 0.5, 1.0],
          });
          keyframes.push({
            frame: endFrame,
            transform: { x: baseValX, y: baseValY, scaleX: 1.0, scaleY: 1.0, rotation: 0, opacity: 1.0 },
            bezier: [0.25, 1.0, 0.5, 1.0],
          });
        } else if (p.intentToken === 'EMPHASIZE') {
          keyframes.push({
            frame: startFrame,
            transform: { x: baseValX, y: baseValY, scaleX: 1.0, scaleY: 1.0, rotation: 0, opacity: 1.0 },
            bezier: [0.25, 1.0, 0.5, 1.0],
          });
          for (let f = startFrame + 10; f < endFrame; f += 10) {
            const shift = f % 20 === 0 ? 15 : -15;
            keyframes.push({
              frame: f,
              transform: { x: baseValX + shift, y: baseValY, scaleX: 1.0, scaleY: 1.0, rotation: 0, opacity: 1.0 },
              bezier: [0.25, 1.0, 0.5, 1.0],
            });
          }
          keyframes.push({
            frame: endFrame,
            transform: { x: baseValX, y: baseValY, scaleX: 1.0, scaleY: 1.0, rotation: 0, opacity: 1.0 },
            bezier: [0.25, 1.0, 0.5, 1.0],
          });
        }
      }

      keyframes.sort((a, b) => a.frame - b.frame);

      if (!keyframes.some(k => k.frame === 0)) {
        const startsInvisible = programs.some(p => p.intentToken === 'ENTER' && p.startMs > 0);
        keyframes.unshift({
          frame: 0,
          transform: {
            x: baseValX,
            y: startsInvisible ? baseValY + 200 : baseValY,
            scaleX: startsInvisible ? 0.5 : 1.0,
            scaleY: startsInvisible ? 0.5 : 1.0,
            rotation: 0,
            opacity: startsInvisible ? 0.0 : 1.0
          },
          bezier: [0.25, 1.0, 0.5, 1.0],
        });
      }

      assetsRenderBlocks.push({
        assetId: asset.assetId,
        resolvedUri: `assets/${asset.assetId}.svg`,
        layer: asset.zIndex === 1 ? 'background' : (asset.zIndex === 10 ? 'midground' : 'foreground'),
        zIndex: asset.zIndex,
        keyframes,
      });
      context.metrics.increment('CP-005-AssetsCompiled');
    }

    assetsRenderBlocks.sort((a, b) => a.zIndex - b.zIndex);

    const cameraKeyframes = camera.cameraProgram.map(item => ({
      frame: Math.round(item.startMs * fps / 1000),
      x: width / 2,
      y: height / 2,
      zoom: item.action === 'PUSH_SOFT' ? 1.2 : 1.0,
      bezier: [0.25, 1.0, 0.5, 1.0] as [number, number, number, number],
    }));

    // Ensure we have at least a keyframe at frame 0 for camera
    if (!cameraKeyframes.some(k => k.frame === 0)) {
      cameraKeyframes.unshift({
        frame: 0,
        x: width / 2,
        y: height / 2,
        zoom: 1.0,
        bezier: [0.25, 1.0, 0.5, 1.0],
      });
    }

    builder.cameraBlock({ keyframes: cameraKeyframes });

    try {
      for (const block of assetsRenderBlocks) {
        builder.addAssetBlock(block);
      }
      const renderIr = builder.build();
      const runDuration = Date.now() - startTime;
      context.metrics.set('CP-005-DurationMs', runDuration);

      deepFreeze(renderIr);
      return { success: true, data: renderIr };
    } catch (err: any) {
      context.diagnostics.add('CP-005-P05', 'FATAL', `Assembly failure: ${err.message}`);
      return {
        success: false,
        errors: [new CompilerError(err.message, 'CP-005-ERR-01', 'FATAL', 'QG-9', 'CP-005')],
      };
    }
  }
}
