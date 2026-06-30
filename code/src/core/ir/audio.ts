import { z } from 'zod';
import { IRMetadataSchema } from './metadata.js';
import { Result } from '../utils/result.js';

export const AudioFingerprintSchema = z.object({
  averageLufs: z.number(),
  pauseDensity: z.number().min(0.0).max(1.0),
  sfxRatio: z.number().min(0.0).max(1.0),
  narrationRatio: z.number().min(0.0).max(1.0),
  ambientRatio: z.number().min(0.0).max(1.0),
  musicRatio: z.number().min(0.0).max(1.0),
}).readonly();

export type AudioFingerprint = z.infer<typeof AudioFingerprintSchema>;

export const AudioEnvelopePointSchema = z.object({
  offsetMs: z.number().int().nonnegative(),
  volumeDb: z.number(),
}).readonly();

export type AudioEnvelopePoint = z.infer<typeof AudioEnvelopePointSchema>;

export const AudioTrackItemSchema = z.object({
  eventId: z.string(),
  resolvedFileUri: z.string(),
  startMs: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  loop: z.boolean(),
  motivation: z.enum(['explain', 'compare', 'reveal', 'emphasize', 'transition', 'maintain_presence']),
  gainEnvelope: z.array(AudioEnvelopePointSchema),
}).readonly();

export type AudioTrackItem = z.infer<typeof AudioTrackItemSchema>;

export const AudioTracksSchema = z.object({
  narration: z.array(AudioTrackItemSchema),
  sfx: z.array(AudioTrackItemSchema),
  ambient: z.array(AudioTrackItemSchema),
  music: z.array(AudioTrackItemSchema),
}).readonly();

export type AudioTracks = z.infer<typeof AudioTracksSchema>;

export const AudioIRSchema = IRMetadataSchema.extend({
  audioId: z.string(),
  storyboardId: z.string(),
  totalDurationMs: z.number().int().nonnegative(),
  masterLoudnessLufs: z.number(),
  audioFingerprint: AudioFingerprintSchema,
  tracks: AudioTracksSchema,
}).readonly();

export type AudioIR = z.infer<typeof AudioIRSchema>;

export function validateAudioIR(json: unknown): Result<AudioIR> {
  const result = AudioIRSchema.safeParse(json);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.errors.map(
    (err: z.ZodIssue) => `[${err.path.join('.')}] ${err.message}`
  );
  return { success: false, errors };
}
