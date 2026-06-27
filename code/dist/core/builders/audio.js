import { AudioIRSchema } from '../ir/audio.js';
import { computeFingerprint } from '../utils/hash.js';
export class AudioBuilder {
    _id = '';
    _storyboardId = '';
    _totalDurationMs = 0;
    _masterLoudnessLufs = -14.0;
    _fingerprint = {
        averageLufs: -14.0,
        pauseDensity: 0.0,
        sfxRatio: 0.0,
        narrationRatio: 1.0,
        ambientRatio: 0.0,
        musicRatio: 0.0,
    };
    _tracks = {
        narration: [],
        sfx: [],
        ambient: [],
        music: [],
    };
    id(id) {
        this._id = id;
        return this;
    }
    storyboardId(storyboardId) {
        this._storyboardId = storyboardId;
        return this;
    }
    totalDurationMs(totalDurationMs) {
        this._totalDurationMs = totalDurationMs;
        return this;
    }
    masterLoudnessLufs(masterLoudnessLufs) {
        this._masterLoudnessLufs = masterLoudnessLufs;
        return this;
    }
    fingerprint(fingerprint) {
        this._fingerprint = fingerprint;
        return this;
    }
    addTrackItem(track, item) {
        this._tracks[track].push(item);
        return this;
    }
    build() {
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
