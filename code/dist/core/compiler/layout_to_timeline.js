import { TimelineBuilder } from '../builders/timeline.js';
import { deepFreeze } from '../utils/freeze.js';
import { CompilerError } from '../utils/errors.js';
export class LayoutToTimelineCompiler {
    id = 'CP-002';
    version = '1.0';
    compile(input, context) {
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
        const visualEvents = [];
        const scheduledAssets = new Set();
        let sceneOffset = 0;
        for (const sc of storyboard.scenes) {
            for (const asset of sc.assets) {
                if (!scheduledAssets.has(asset.assetId)) {
                    scheduledAssets.add(asset.assetId);
                    const enterEvent = {
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
        const captionEvents = [];
        const narrationEvents = [];
        let captionOffset = 0;
        let captionCounter = 1;
        for (const sc of storyboard.scenes) {
            const pad = String(captionCounter++).padStart(3, '0');
            const captionEvent = {
                eventId: `EVT-CAP-${pad}`,
                startMs: captionOffset,
                durationMs: sc.durationMs,
                payload: { text: sc.rawScript },
            };
            builder.addEvent('captions', captionEvent);
            captionEvents.push(captionEvent);
            context.metrics.increment('CP-002-CaptionEventsScheduled');
            const narrationEvent = {
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
        }
        catch (err) {
            context.diagnostics.add('CP-002-P05', 'FATAL', `Assembly failure: ${err.message}`);
            return {
                success: false,
                errors: [new CompilerError(err.message, 'CP-002-ERR-05', 'FATAL', 'QG-11', 'CP-002')],
            };
        }
    }
}
