import { TimelineIR, TimelineEvent, TimelineTracks, TimelineIRSchema } from '../ir/timeline.js';
import { computeFingerprint } from '../utils/hash.js';

export class TimelineBuilder {
  private _id: string = '';
  private _storyboardId: string = '';
  private _sceneId: string = '';
  private _masterClockMs: number = 0;
  private _tracks: TimelineTracks = {
    narration: [],
    visual: [],
    camera: [],
    captions: [],
    audio: [],
    effects: [],
  };

  id(id: string): this {
    this._id = id;
    return this;
  }

  storyboardId(storyboardId: string): this {
    this._storyboardId = storyboardId;
    return this;
  }

  sceneId(sceneId: string): this {
    this._sceneId = sceneId;
    return this;
  }

  masterClockMs(masterClockMs: number): this {
    this._masterClockMs = masterClockMs;
    return this;
  }

  addEvent(track: keyof TimelineTracks, event: TimelineEvent): this {
    this._tracks[track].push(event);
    return this;
  }

  build(): TimelineIR {
    const rawContent = {
      storyboardId: this._storyboardId,
      sceneId: this._sceneId,
      masterClockMs: this._masterClockMs,
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
    return TimelineIRSchema.parse(compiled);
  }
}
