import { z } from 'zod';
export const IRMetadataSchema = z.object({
    id: z.string(),
    version: z.string(),
    compilerVersion: z.string(),
    createdAt: z.string().datetime(),
    fingerprint: z.string(),
});
