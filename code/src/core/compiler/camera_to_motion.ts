import { StoryboardIR } from '../ir/storyboard.js';
import { LayoutIR } from '../ir/layout.js';
import { TimelineIR } from '../ir/timeline.js';
import { CameraIR } from '../ir/camera.js';
import { MotionIR, MotionProgramItem } from '../ir/motion.js';
import { MotionBuilder } from '../builders/motion.js';
import { CompilerContext } from './context.js';
import { Result } from '../utils/result.js';
import { deepFreeze } from '../utils/freeze.js';
import { CompilerPass } from './pass.js';
import { CompilerError } from '../utils/errors.js';

export interface CameraToMotionInput {
  readonly storyboard: StoryboardIR;
  readonly layout: LayoutIR;
  readonly timeline: TimelineIR;
  readonly camera: CameraIR;
}

export class CameraToMotionCompiler implements CompilerPass<CameraToMotionInput, MotionIR> {
  readonly id = 'CP-004';
  readonly version = '1.0';

  compile(
    input: Readonly<CameraToMotionInput>,
    context: CompilerContext
  ): Result<Readonly<MotionIR>, CompilerError[]> {
    const startTime = Date.now();
    context.metrics.increment('CP-004-Runs');

    const storyboard = input.storyboard;
    const layout = input.layout;
    const timeline = input.timeline;

    const builder = new MotionBuilder()
      .id(`MOT-${storyboard.id}`)
      .storyboardId(storyboard.id)
      .sceneId(layout.sceneId)
      .aspectRatio(layout.aspectRatio)
      .fingerprint({
        enterPercent: 20,
        highlightPercent: 80,
        morphPercent: 0,
        idlePercent: 0,
        exitPercent: 0,
      });

    const visualEvents = timeline.tracks.visual;
    const resolvedItems: MotionProgramItem[] = [];

    let programCounter = 1;
    for (const event of visualEvents) {
      if (event.payload && event.payload['action'] === 'ENTER') {
        const targetAssetId = event.payload['assetId'];
        if (typeof targetAssetId === 'string') {
          const item: MotionProgramItem = {
            programId: `MOT-000${programCounter++}`,
            targetAssetId,
            category: 'Structural',
            priority: 'Critical',
            intentToken: 'ENTER',
            direction: 'none',
            speed: 'MEDIUM',
            startMs: event.startMs,
            durationMs: event.durationMs,
            motivation: 'reveal',
          };
          resolvedItems.push(item);
          context.metrics.increment('CP-004-MotionsResolved');
        }
      }
    }

    const primaryAsset = layout.layoutAssets.find(a => a.zIndex === 10);
    const captionEvent = timeline.tracks.captions[0];
    if (primaryAsset && captionEvent) {
      const item: MotionProgramItem = {
        programId: `MOT-000${programCounter++}`,
        targetAssetId: primaryAsset.assetId,
        category: 'Attention',
        priority: 'Normal',
        intentToken: 'EMPHASIZE',
        direction: 'none',
        speed: 'MEDIUM',
        startMs: captionEvent.startMs + 1000,
        durationMs: captionEvent.durationMs - 1000,
        motivation: 'emphasize',
      };
      resolvedItems.push(item);
      context.metrics.increment('CP-004-MotionsResolved');
    }

    for (const item of resolvedItems) {
      if (item.startMs + item.durationMs > timeline.masterClockMs) {
        context.diagnostics.add('CP-004-P04', 'ERROR', `Motion ${item.programId} out of scene bounds`);
        return {
          success: false,
          errors: [new CompilerError('Motion out of bounds', 'CP-004-ERR-02', 'ERROR', 'QG-13', 'CP-004')],
        };
      }
    }

    try {
      for (const item of resolvedItems) {
        builder.addProgramItem(item);
      }
      const motionIr = builder.build();
      const runDuration = Date.now() - startTime;
      context.metrics.set('CP-004-DurationMs', runDuration);

      deepFreeze(motionIr);
      return { success: true, data: motionIr };
    } catch (err: any) {
      context.diagnostics.add('CP-004-P05', 'FATAL', `Assembly failure: ${err.message}`);
      return {
        success: false,
        errors: [new CompilerError(err.message, 'CP-004-ERR-03', 'FATAL', 'QG-13', 'CP-004')],
      };
    }
  }
}
