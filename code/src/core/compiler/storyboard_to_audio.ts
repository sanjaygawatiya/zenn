import { StoryboardIR } from '../ir/storyboard.js';
import { TimelineIR } from '../ir/timeline.js';
import { AudioIR, AudioTrackItem, AudioEnvelopePoint } from '../ir/audio.js';
import { AudioBuilder } from '../builders/audio.js';
import { CompilerContext } from './context.js';
import { Result } from '../utils/result.js';
import { deepFreeze } from '../utils/freeze.js';
import { CompilerPass } from './pass.js';
import { CompilerError } from '../utils/errors.js';

export interface StoryboardToAudioInput {
  readonly storyboard: StoryboardIR;
  readonly timeline: TimelineIR;
}

export class StoryboardToAudioCompiler implements CompilerPass<StoryboardToAudioInput, AudioIR> {
  readonly id = 'CP-006';
  readonly version = '1.0';

  compile(
    input: Readonly<StoryboardToAudioInput>,
    context: CompilerContext
  ): Result<Readonly<AudioIR>, CompilerError[]> {
    const startTime = Date.now();
    context.metrics.increment('CP-006-Runs');

    const storyboard = input.storyboard;
    const timeline = input.timeline;

    const builder = new AudioBuilder()
      .id(`AUD-${storyboard.id}`)
      .storyboardId(storyboard.id)
      .totalDurationMs(timeline.masterClockMs)
      .masterLoudnessLufs(-14.0);

    // 1. Narration Track
    const narrationEvents = timeline.tracks.narration;
    for (const event of narrationEvents) {
      const suffix = event.eventId.replace('EVT-VO-', '');
      const trackItem: AudioTrackItem = {
        eventId: event.eventId,
        resolvedFileUri: `audio/narration_${suffix}.wav`,
        startMs: event.startMs,
        durationMs: event.durationMs,
        loop: false,
        motivation: 'reveal',
        gainEnvelope: [
          { offsetMs: 0, volumeDb: 0.0 },
        ],
      };
      builder.addTrackItem('narration', trackItem);
      context.metrics.increment('CP-006-TracksCompiled');
    }

    // 2. Music Track with Dynamic Ducking Envelopes
    const musicEnvelope: AudioEnvelopePoint[] = [{ offsetMs: 0, volumeDb: 0.0 }];
    for (const event of narrationEvents) {
      const startMs = event.startMs;
      const endMs = event.startMs + event.durationMs;

      // Duck down to -12.0 dB starting 100ms before speech, completing 100ms after speech starts
      const duckStart = Math.max(0, startMs - 100);
      const duckLow = startMs + 100;
      const duckEndLow = Math.max(duckLow, endMs - 100);
      const duckReturn = endMs + 100;

      musicEnvelope.push({ offsetMs: duckStart, volumeDb: 0.0 });
      musicEnvelope.push({ offsetMs: duckLow, volumeDb: -12.0 });
      musicEnvelope.push({ offsetMs: duckEndLow, volumeDb: -12.0 });
      musicEnvelope.push({ offsetMs: duckReturn, volumeDb: 0.0 });
    }

    const musicTrack: AudioTrackItem = {
      eventId: 'EVT-MUS-001',
      resolvedFileUri: 'audio/music_background.wav',
      startMs: 0,
      durationMs: timeline.masterClockMs,
      loop: true,
      motivation: 'maintain_presence',
      gainEnvelope: musicEnvelope,
    };
    builder.addTrackItem('music', musicTrack);
    context.metrics.increment('CP-006-TracksCompiled');

    // 3. Ambient Track (looping room/studio tone, ducked slightly by -6.0 dB)
    const ambientEnvelope: AudioEnvelopePoint[] = [{ offsetMs: 0, volumeDb: -3.0 }];
    for (const event of narrationEvents) {
      const startMs = event.startMs;
      const endMs = event.startMs + event.durationMs;

      ambientEnvelope.push({ offsetMs: Math.max(0, startMs - 100), volumeDb: -3.0 });
      ambientEnvelope.push({ offsetMs: startMs + 100, volumeDb: -9.0 });
      ambientEnvelope.push({ offsetMs: Math.max(startMs + 100, endMs - 100), volumeDb: -9.0 });
      ambientEnvelope.push({ offsetMs: endMs + 100, volumeDb: -3.0 });
    }

    const ambientTrack: AudioTrackItem = {
      eventId: 'EVT-AMB-001',
      resolvedFileUri: 'audio/ambient_hum.wav',
      startMs: 0,
      durationMs: timeline.masterClockMs,
      loop: true,
      motivation: 'maintain_presence',
      gainEnvelope: ambientEnvelope,
    };
    builder.addTrackItem('ambient', ambientTrack);
    context.metrics.increment('CP-006-TracksCompiled');

    // 4. SFX Track (swoop sound on asset entrance, click on vibration emphasis)
    const visualEvents = timeline.tracks.visual;
    let sfxCounter = 1;
    for (const event of visualEvents) {
      if (event.payload && event.payload['action'] === 'ENTER') {
        const swoopSfx: AudioTrackItem = {
          eventId: `EVT-SFX-00${sfxCounter++}`,
          resolvedFileUri: 'audio/sfx_whoosh.wav',
          startMs: event.startMs,
          durationMs: event.durationMs,
          loop: false,
          motivation: 'transition',
          gainEnvelope: [{ offsetMs: 0, volumeDb: 0.0 }],
        };
        builder.addTrackItem('sfx', swoopSfx);
        context.metrics.increment('CP-006-TracksCompiled');
      }
    }

    // Loop for vibration emphasis on primary subject asset
    const primaryAssetId = storyboard.scenes[0]?.assets.find(a => a.role === 'primary_subject')?.assetId;
    const primaryEvent = timeline.tracks.visual.find(e => e.payload && e.payload['assetId'] === primaryAssetId);
    const captionEvent = timeline.tracks.captions[0];
    if (primaryEvent && captionEvent) {
      const vibrationSfx: AudioTrackItem = {
        eventId: `EVT-SFX-00${sfxCounter++}`,
        resolvedFileUri: 'audio/sfx_vibration.wav',
        startMs: captionEvent.startMs + 1000,
        durationMs: captionEvent.durationMs - 1000,
        loop: false,
        motivation: 'emphasize',
        gainEnvelope: [{ offsetMs: 0, volumeDb: 0.0 }],
      };
      builder.addTrackItem('sfx', vibrationSfx);
      context.metrics.increment('CP-006-TracksCompiled');
    }

    builder.fingerprint({
      averageLufs: -14.0,
      pauseDensity: 0.1,
      sfxRatio: 0.2,
      narrationRatio: 0.5,
      ambientRatio: 0.1,
      musicRatio: 0.2,
    });

    try {
      const audioIr = builder.build();
      const runDuration = Date.now() - startTime;
      context.metrics.set('CP-006-DurationMs', runDuration);

      deepFreeze(audioIr);
      return { success: true, data: audioIr };
    } catch (err: any) {
      context.diagnostics.add('CP-006-P04', 'FATAL', `Assembly failure: ${err.message}`);
      return {
        success: false,
        errors: [new CompilerError(err.message, 'CP-006-ERR-01', 'FATAL', 'QG-11', 'CP-006')],
      };
    }
  }
}
