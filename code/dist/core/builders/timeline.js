import { TimelineIRSchema } from '../ir/timeline.js';
import { computeFingerprint } from '../utils/hash.js';
export class TimelineBuilder {
    _id = '';
    _storyboardId = '';
    _sceneId = '';
    _masterClockMs = 0;
    _tracks = {
        narration: [],
        visual: [],
        camera: [],
        captions: [],
        audio: [],
        effects: [],
    };
    id(id) {
        this._id = id;
        return this;
    }
    storyboardId(storyboardId) {
        this._storyboardId = storyboardId;
        return this;
    }
    sceneId(sceneId) {
        this._sceneId = sceneId;
        return this;
    }
    masterClockMs(masterClockMs) {
        this._masterClockMs = masterClockMs;
        return this;
    }
    addEvent(track, event) {
        this._tracks[track].push(event);
        return this;
    }
    build() {
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
