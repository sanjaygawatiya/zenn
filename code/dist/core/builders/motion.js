import { MotionIRSchema } from '../ir/motion.js';
import { computeFingerprint } from '../utils/hash.js';
export class MotionBuilder {
    _id = '';
    _storyboardId = '';
    _sceneId = '';
    _aspectRatio = '16_9';
    _fingerprint = {
        enterPercent: 0,
        highlightPercent: 0,
        morphPercent: 0,
        idlePercent: 100,
        exitPercent: 0,
    };
    _motionProgram = [];
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
    aspectRatio(aspectRatio) {
        this._aspectRatio = aspectRatio;
        return this;
    }
    fingerprint(fingerprint) {
        this._fingerprint = fingerprint;
        return this;
    }
    addProgramItem(item) {
        this._motionProgram.push(item);
        return this;
    }
    build() {
        const rawContent = {
            storyboardId: this._storyboardId,
            sceneId: this._sceneId,
            aspectRatio: this._aspectRatio,
            motionFingerprint: this._fingerprint,
            motionProgram: this._motionProgram,
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
        return MotionIRSchema.parse(compiled);
    }
}
