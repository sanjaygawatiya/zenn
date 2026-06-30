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

    if (storyboard.scenes.length === 0) {
      context.diagnostics.add('CP-002-P01', 'ERROR', 'Storyboard contains no scenes');
      return {
        success: false,
        errors: [new CompilerError('Storyboard contains no scenes', 'CP-002-ERR-01', 'ERROR', 'QG-11', 'CP-002')],
      };
    }

    const durationMs = storyboard.scenes.reduce((sum, s) => sum + s.durationMs, 0);
    if (durationMs <= 0 || durationMs % 1 !== 0) {
      context.diagnostics.add('CP-002-P01', 'ERROR', 'Total storyboard duration must be a positive integer');
      return {
        success: false,
        errors: [new CompilerError('Storyboard duration invalid', 'CP-002-ERR-02', 'ERROR', 'QG-11', 'CP-002')],
      };
    }

    const builder = new TimelineBuilder()
      .id(`TIM-${storyboard.id}`)
      .storyboardId(storyboard.id)
      .sceneId(layout.sceneId)
      .masterClockMs(durationMs);

    const visualEvents: TimelineEvent[] = [];
    const scheduledAssets = new Set<string>();
    let sceneOffset = 0;
    for (const sc of storyboard.scenes) {
      for (const asset of sc.assets) {
        if (!scheduledAssets.has(asset.assetId)) {
          scheduledAssets.add(asset.assetId);
          const enterEvent: TimelineEvent = {
            eventId: `EVT-VIS-ENTER-${asset.assetId}`,
            startMs: sceneOffset,
            durationMs: 500,
            payload: { assetId: asset.assetId, action: 'ENTER' },
          };
          builder.addEvent('visual', enterEvent);
          visualEvents.push(enterEvent);
          context.metrics.increment('CP-002-VisualEventsScheduled');
        }
      }
      sceneOffset += sc.durationMs;
    }

    const captionEvents: TimelineEvent[] = [];
    const narrationEvents: TimelineEvent[] = [];
    let captionOffset = 0;
    let captionCounter = 1;
    for (const sc of storyboard.scenes) {
      const pad = String(captionCounter++).padStart(3, '0');
      const captionEvent: TimelineEvent = {
        eventId: `EVT-CAP-${pad}`,
        startMs: captionOffset,
        durationMs: sc.durationMs,
        payload: { text: sc.rawScript },
      };
      builder.addEvent('captions', captionEvent);
      captionEvents.push(captionEvent);
      context.metrics.increment('CP-002-CaptionEventsScheduled');

      const narrationEvent: TimelineEvent = {
        eventId: `EVT-VO-${pad}`,
        startMs: captionOffset,
        durationMs: sc.durationMs,
        payload: { text: sc.rawScript },
      };
      builder.addEvent('narration', narrationEvent);
      narrationEvents.push(narrationEvent);
      context.metrics.increment('CP-002-NarrationEventsScheduled');

      captionOffset += sc.durationMs;
    }

    const allEvents = [...visualEvents, ...captionEvents, ...narrationEvents];
    for (const event of allEvents) {
      if (event.startMs % 1 !== 0 || event.durationMs % 1 !== 0) {
        context.diagnostics.add('CP-002-P04', 'ERROR', `Event ${event.eventId} contains floating-point values`);
        return {
          success: false,
          errors: [new CompilerError('Non-integer timestamp detected', 'CP-002-ERR-03', 'ERROR', 'QG-11', 'CP-002')],
        };
      }
      if (event.startMs + event.durationMs > durationMs) {
        context.diagnostics.add('CP-002-P04', 'ERROR', `Event ${event.eventId} exceeds timeline duration limits`);
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
