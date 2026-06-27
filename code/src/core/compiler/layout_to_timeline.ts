import { StoryboardIR } from '../ir/storyboard.js';
import { LayoutIR } from '../ir/layout.js';
import { TimelineIR, TimelineEvent } from '../ir/timeline.js';
import { TimelineBuilder } from '../builders/timeline.js';
import { CompilerContext } from './context.js';
import { Result } from '../utils/result.js';
import { deepFreeze } from '../utils/freeze.js';
import { CompilerPass } from './pass.js';
import { CompilerError } from '../utils/errors.js';

export interface LayoutToTimelineInput {
  readonly storyboard: StoryboardIR;
  readonly layout: LayoutIR;
}

export class LayoutToTimelineCompiler implements CompilerPass<LayoutToTimelineInput, TimelineIR> {
  readonly id = 'CP-002';
  readonly version = '1.0';

  compile(
    input: Readonly<LayoutToTimelineInput>,
    context: CompilerContext
  ): Result<Readonly<TimelineIR>, CompilerError[]> {
    const startTime = Date.now();
    context.metrics.increment('CP-002-Runs');

    const storyboard = input.storyboard;
    const layout = input.layout;

    const scene = storyboard.scenes.find(s => s.sceneId === layout.sceneId);
    if (!scene) {
      context.diagnostics.add('CP-002-P01', 'ERROR', `Storyboard scene not found for Layout scene ID ${layout.sceneId}`);
      return {
        success: false,
        errors: [new CompilerError(`Scene not found: ${layout.sceneId}`, 'CP-002-ERR-01', 'ERROR', 'QG-11', 'CP-002')],
      };
    }

    const durationMs = scene.durationMs;
    if (durationMs <= 0 || durationMs % 1 !== 0) {
      context.diagnostics.add('CP-002-P01', 'ERROR', 'Scene duration must be a positive integer milliseconds value');
      return {
        success: false,
        errors: [new CompilerError('Scene duration invalid', 'CP-002-ERR-02', 'ERROR', 'QG-11', 'CP-002')],
      };
    }

    const builder = new TimelineBuilder()
      .id(`TIM-${storyboard.id}`)
      .storyboardId(storyboard.id)
      .sceneId(layout.sceneId)
      .masterClockMs(durationMs);

    const layoutAssets = [...layout.layoutAssets].sort((a, b) => a.assetId.localeCompare(b.assetId));

    const visualEvents: TimelineEvent[] = [];
    for (const asset of layoutAssets) {
      const enterEvent: TimelineEvent = {
        eventId: `EVT-VIS-ENTER-${asset.assetId}`,
        startMs: 0,
        durationMs: 500,
        payload: { assetId: asset.assetId, action: 'ENTER' },
      };
      builder.addEvent('visual', enterEvent);
      visualEvents.push(enterEvent);
      context.metrics.increment('CP-002-VisualEventsScheduled');
    }

    const captionEvent: TimelineEvent = {
      eventId: `EVT-CAP-001`,
      startMs: 0,
      durationMs: Math.min(4000, durationMs),
      payload: { text: scene.rawScript },
    };
    builder.addEvent('captions', captionEvent);
    context.metrics.increment('CP-002-CaptionEventsScheduled');

    const allEvents = [...visualEvents, captionEvent];
    for (const event of allEvents) {
      if (event.startMs % 1 !== 0 || event.durationMs % 1 !== 0) {
        context.diagnostics.add('CP-002-P04', 'ERROR', `Event ${event.eventId} contains floating-point values`);
        return {
          success: false,
          errors: [new CompilerError('Non-integer timestamp detected', 'CP-002-ERR-03', 'ERROR', 'QG-11', 'CP-002')],
        };
      }
      if (event.startMs + event.durationMs > durationMs) {
        context.diagnostics.add('CP-002-P04', 'ERROR', `Event ${event.eventId} exceeds scene duration limits`);
        return {
          success: false,
          errors: [new CompilerError('Event duration overrun', 'CP-002-ERR-04', 'ERROR', 'QG-11', 'CP-002')],
        };
      }
    }

    try {
      const timelineIr = builder.build();
      const runDuration = Date.now() - startTime;
      context.metrics.set('CP-002-DurationMs', runDuration);

      deepFreeze(timelineIr);
      return { success: true, data: timelineIr };
    } catch (err: any) {
      context.diagnostics.add('CP-002-P05', 'FATAL', `Assembly failure: ${err.message}`);
      return {
        success: false,
        errors: [new CompilerError(err.message, 'CP-002-ERR-05', 'FATAL', 'QG-11', 'CP-002')],
      };
    }
  }
}
