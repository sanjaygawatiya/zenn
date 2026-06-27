import { z } from 'zod';
import { IRMetadataSchema } from './metadata.js';
import { Result } from '../utils/result.js';

export const TimelineEventSchema = z.object({
  eventId: z.string(),
  startMs: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  payload: z.record(z.unknown()).optional(),
}).readonly();

export type TimelineEvent = z.infer<typeof TimelineEventSchema>;

export const TimelineTracksSchema = z.object({
  narration: z.array(TimelineEventSchema),
  visual: z.array(TimelineEventSchema),
  camera: z.array(TimelineEventSchema),
  captions: z.array(TimelineEventSchema),
  audio: z.array(TimelineEventSchema),
  effects: z.array(TimelineEventSchema),
}).readonly();

export type TimelineTracks = z.infer<typeof TimelineTracksSchema>;

export const TimelineIRSchema = IRMetadataSchema.extend({
  storyboardId: z.string(),
  sceneId: z.string().regex(/^SCN-\d{4}$/),
  masterClockMs: z.number().int().nonnegative(),
  tracks: TimelineTracksSchema,
}).readonly();

export type TimelineIR = z.infer<typeof TimelineIRSchema>;

export function validateTimelineIR(json: unknown): Result<TimelineIR> {
  const result = TimelineIRSchema.safeParse(json);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.errors.map(
    (err: z.ZodIssue) => `[${err.path.join('.')}] ${err.message}`
  );
  return { success: false, errors };
}
