import { CameraBuilder } from '../builders/camera.js';
import { deepFreeze } from '../utils/freeze.js';
import { CompilerError } from '../utils/errors.js';
export class TimelineToCameraCompiler {
    id = 'CP-003';
    version = '1.0';
    compile(input, context) {
        const startTime = Date.now();
        context.metrics.increment('CP-003-Runs');
        const storyboard = input.storyboard;
        const layout = input.layout;
        const timeline = input.timeline;
        const primaryAsset = layout.layoutAssets.find(a => a.zIndex === 10);
        if (!primaryAsset) {
            context.diagnostics.add('CP-003-P01', 'ERROR', 'Could not resolve camera target primary subject');
            return {
                success: false,
                errors: [new CompilerError('Missing target asset', 'CP-003-ERR-01', 'ERROR', 'QG-12', 'CP-003')],
            };
        }
        const builder = new CameraBuilder()
            .id(`CAM-${storyboard.id}`)
            .storyboardId(storyboard.id)
            .sceneId(layout.sceneId)
            .aspectRatio(layout.aspectRatio);
        const hasVisualEvents = timeline.tracks.visual && timeline.tracks.visual.length > 0;
        const shouldAddMove = timeline.masterClockMs >= 4000 && hasVisualEvents;
        const initialDuration = shouldAddMove ? 1000 : timeline.masterClockMs;
        const initialItem = {
            programId: 'CAM-0001',
            startMs: 0,
            durationMs: initialDuration,
            action: 'LOCK',
            motivation: 'Reveal',
            shotType: 'Close',
            framingRule: 'Centered',
            targetAssetId: primaryAsset.assetId,
            intensity: 'medium',
        };
        builder.addProgramItem(initialItem);
        context.metrics.increment('CP-003-ProgramsResolved');
        if (shouldAddMove) {
            const moveDuration = timeline.masterClockMs - 2000;
            if (moveDuration < 500) {
                context.diagnostics.add('CP-003-P04', 'ERROR', 'Camera movement velocity exceeds standard safe limits');
                return {
                    success: false,
                    errors: [new CompilerError('Camera velocity error', 'CP-003-ERR-03', 'ERROR', 'QG-12', 'CP-003')],
                };
            }
            const moveItem = {
                programId: 'CAM-0002',
                startMs: 1000,
                durationMs: moveDuration,
                action: 'PUSH_SOFT',
                motivation: 'Inspect',
                shotType: 'Macro',
                framingRule: 'Centered',
                targetAssetId: primaryAsset.assetId,
                intensity: 'medium',
            };
            builder.addProgramItem(moveItem);
            context.metrics.increment('CP-003-ProgramsResolved');
        }
        try {
            const cameraIr = builder.build();
            const runDuration = Date.now() - startTime;
            context.metrics.set('CP-003-DurationMs', runDuration);
            deepFreeze(cameraIr);
            return { success: true, data: cameraIr };
        }
        catch (err) {
            context.diagnostics.add('CP-003-P05', 'FATAL', `Assembly failure: ${err.message}`);
            return {
                success: false,
                errors: [new CompilerError(err.message, 'CP-003-ERR-04', 'FATAL', 'QG-12', 'CP-003')],
            };
        }
    }
}
