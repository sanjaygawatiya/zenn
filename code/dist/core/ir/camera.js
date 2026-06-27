import { z } from 'zod';
import { IRMetadataSchema } from './metadata.js';
export const CameraFingerprintSchema = z.object({
    pushPercent: z.number().min(0.0).max(100.0),
    panPercent: z.number().min(0.0).max(100.0),
    staticPercent: z.number().min(0.0).max(100.0),
    pullPercent: z.number().min(0.0).max(100.0),
}).readonly();
export const CameraProgramItemSchema = z.object({
    programId: z.string(),
    startMs: z.number().int().nonnegative(),
    durationMs: z.number().int().nonnegative(),
    action: z.enum(['LOCK', 'HOLD', 'PUSH_SOFT', 'PULL_SOFT', 'PAN_GUIDED', 'SNAP', 'FOLLOW']),
    motivation: z.enum(['Reveal', 'Inspect', 'Compare', 'Follow', 'Summarize', 'Transition']),
    shotType: z.enum(['Macro', 'ExtremeClose', 'Close', 'Medium', 'Wide', 'Overview']),
    framingRule: z.enum(['Centered', 'RuleOfThirds', 'Diagonal', 'Split', 'GoldenRatio']),
    targetAssetId: z.string(),
    intensity: z.enum(['low', 'medium', 'high']),
}).readonly();
export const CameraIRSchema = IRMetadataSchema.extend({
    storyboardId: z.string(),
    sceneId: z.string().regex(/^SCN-\d{4}$/),
    aspectRatio: z.enum(['16_9', '9_16']),
    cameraFingerprint: CameraFingerprintSchema,
    cameraProgram: z.array(CameraProgramItemSchema),
}).readonly();
export function validateCameraIR(json) {
    const result = CameraIRSchema.safeParse(json);
    if (result.success) {
        return { success: true, data: result.data };
    }
    const errors = result.error.errors.map((err) => `[${err.path.join('.')}] ${err.message}`);
    return { success: false, errors };
}
