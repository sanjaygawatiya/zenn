import { z } from 'zod';
import { IRMetadataSchema } from './metadata.js';
export const LayoutAssetSchema = z.object({
    assetId: z.string(),
    anchorX: z.number().min(0.0).max(1.0),
    anchorY: z.number().min(0.0).max(1.0),
    centerX: z.number().min(0.0).max(1.0),
    centerY: z.number().min(0.0).max(1.0),
    width: z.number().min(0.0).max(1.0),
    height: z.number().min(0.0).max(1.0),
    zIndex: z.number().int(),
    parentId: z.string().optional(),
}).readonly();
export const LayoutIRSchema = IRMetadataSchema.extend({
    storyboardId: z.string(),
    sceneId: z.string().regex(/^SCN-\d{4}$/),
    aspectRatio: z.enum(['16_9', '9_16']),
    layoutAssets: z.array(LayoutAssetSchema),
}).readonly();
export function validateLayoutIR(json) {
    const result = LayoutIRSchema.safeParse(json);
    if (result.success) {
        return { success: true, data: result.data };
    }
    const errors = result.error.errors.map((err) => `[${err.path.join('.')}] ${err.message}`);
    return { success: false, errors };
}
