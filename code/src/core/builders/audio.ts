import { AudioIR, AudioTracks, AudioFingerprint, AudioIRSchema } from '../ir/audio.js';
import { computeFingerprint } from '../utils/hash.js';

export class AudioBuilder {
  private _id: string = '';
  private _storyboardId: string = '';
  private _totalDurationMs: number = 0;
  private _masterLoudnessLufs: number = -14.0;
  private _fingerprint: AudioFingerprint = {
    averageLufs: -14.0,
    pauseDensity: 0.0,
    sfxRatio: 0.0,
    narrationRatio: 1.0,
    ambientRatio: 0.0,
    musicRatio: 0.0,
  };
  private _tracks: AudioTracks = {
    narration: [],
    sfx: [],
    ambient: [],
    music: [],
  };

  id(id: string): this {
    this._id = id;
    return this;
  }

  storyboardId(storyboardId: string): this {
    this._storyboardId = storyboardId;
    return this;
  }

  totalDurationMs(totalDurationMs: number): this {
    this._totalDurationMs = totalDurationMs;
    return this;
  }

  masterLoudnessLufs(masterLoudnessLufs: number): this {
    this._masterLoudnessLufs = masterLoudnessLufs;
    return this;
  }

  fingerprint(fingerprint: AudioFingerprint): this {
    this._fingerprint = fingerprint;
    return this;
  }

  addTrackItem(track: keyof AudioTracks, item: any): this {
    this._tracks[track].push(item);
    return this;
  }

  build(): AudioIR {
    const rawContent = {
      audioId: this._id,
      storyboardId: this._storyboardId,
      totalDurationMs: this._totalDurationMs,
      masterLoudnessLufs: this._masterLoudnessLufs,
      fingerprint: this._fingerprint,
      tracks: this._tracks,
    };
    const fingerprint = computeFingerprint(rawContent);
    const metadata = {
      id: this._id,
      version: '1.0',
      compilerVersion: '1.0.0',
      createdAt: new Date().toISOString(),
      fingerprint,
    };
    const compiled = {
      ...metadata,
      ...rawContent,
    };
    return AudioIRSchema.parse(compiled);
  }
}
