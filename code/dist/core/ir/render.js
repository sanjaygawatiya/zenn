import { z } from 'zod';
import { IRMetadataSchema } from './metadata.js';
export const BezierSchema = z.array(z.number()).min(4).max(4).readonly();
export const AssetKeyframeSchema = z.object({
    frame: z.number().int().nonnegative(),
    transform: z.object({
        x: z.number(),
        y: z.number(),
        scaleX: z.number(),
        scaleY: z.number(),
        rotation: z.number(),
        opacity: z.number().min(0.0).max(1.0),
    }),
    bezier: BezierSchema,
}).readonly();
export const AssetRenderBlockSchema = z.object({
    assetId: z.string(),
    resolvedUri: z.string(),
    layer: z.enum(['background', 'midground', 'foreground', 'overlay', 'caption', 'effects']),
    zIndex: z.number().int(),
    keyframes: z.array(AssetKeyframeSchema),
}).readonly();
export const CameraKeyframeSchema = z.object({
    frame: z.number().int().nonnegative(),
    x: z.number(),
    y: z.number(),
    zoom: z.number(),
    bezier: BezierSchema,
}).readonly();
export const CameraRenderBlockSchema = z.object({
    keyframes: z.array(CameraKeyframeSchema),
}).readonly();
export const RenderIRSchema = IRMetadataSchema.extend({
    renderId: z.string(),
    resolution: z.object({
        width: z.number().int().positive(),
        height: z.number().int().positive(),
    }),
    fps: z.union([z.literal(24), z.literal(30), z.literal(60)]),
    totalFrames: z.number().int().nonnegative(),
    assets: z.array(AssetRenderBlockSchema),
    camera: CameraRenderBlockSchema,
}).readonly();
export function validateRenderIR(json) {
    const result = RenderIRSchema.safeParse(json);
    if (result.success) {
        return { success: true, data: result.data };
    }
    const errors = result.error.errors.map((err) => `[${err.path.join('.')}] ${err.message}`);
    return { success: false, errors };
}
