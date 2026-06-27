import { z } from 'zod';
import { IRMetadataSchema } from './metadata.js';
export const StoryboardAssetSchema = z.object({
    assetId: z.string(),
    type: z.enum(['SVG', 'PNG', 'TXT', 'NODE']),
    role: z.enum(['primary_subject', 'background', 'label', 'annotation', 'decorator']),
    style: z.string(),
    mustRemainVisible: z.boolean().default(false),
}).readonly();
export const StoryboardSceneSchema = z.object({
    sceneId: z.string().regex(/^SCN-\d{4}$/),
    objective: z.string(),
    rawScript: z.string(),
    assets: z.array(StoryboardAssetSchema),
    timingOffsetMs: z.number().int().nonnegative(),
    durationMs: z.number().int().nonnegative(),
}).readonly();
export const StoryboardIRSchema = IRMetadataSchema.extend({
    scenes: z.array(StoryboardSceneSchema),
}).readonly();
export function validateStoryboardIR(json) {
    const result = StoryboardIRSchema.safeParse(json);
    if (result.success) {
        return { success: true, data: result.data };
    }
    const errors = result.error.errors.map((err) => `[${err.path.join('.')}] ${err.message}`);
    return { success: false, errors };
}
