import { z } from 'zod';
import { IRMetadataSchema } from './metadata.js';
export const MotionFingerprintSchema = z.object({
    enterPercent: z.number().min(0.0).max(100.0),
    highlightPercent: z.number().min(0.0).max(100.0),
    morphPercent: z.number().min(0.0).max(100.0),
    idlePercent: z.number().min(0.0).max(100.0),
    exitPercent: z.number().min(0.0).max(100.0),
}).readonly();
export const MotionProgramItemSchema = z.object({
    programId: z.string(),
    targetAssetId: z.string(),
    category: z.enum(['Structural', 'Attention', 'Ambient']),
    priority: z.enum(['Critical', 'Normal', 'Decorative']),
    intentToken: z.enum(['ENTER', 'EXIT', 'EMPHASIZE', 'MORPH', 'HIGHLIGHT', 'IDLE_CREEP']),
    direction: z.enum(['none', 'left', 'right', 'top', 'bottom']),
    speed: z.enum(['SLOW', 'MEDIUM', 'FAST', 'SNAP']),
    startMs: z.number().int().nonnegative(),
    durationMs: z.number().int().nonnegative(),
    motivation: z.enum(['explain', 'compare', 'reveal', 'emphasize', 'transition', 'maintain_presence']),
}).readonly();
export const MotionIRSchema = IRMetadataSchema.extend({
    storyboardId: z.string(),
    sceneId: z.string().regex(/^SCN-\d{4}$/),
    aspectRatio: z.enum(['16_9', '9_16']),
    motionFingerprint: MotionFingerprintSchema,
    motionProgram: z.array(MotionProgramItemSchema),
}).readonly();
export function validateMotionIR(json) {
    const result = MotionIRSchema.safeParse(json);
    if (result.success) {
        return { success: true, data: result.data };
    }
    const errors = result.error.errors.map((err) => `[${err.path.join('.')}] ${err.message}`);
    return { success: false, errors };
}
