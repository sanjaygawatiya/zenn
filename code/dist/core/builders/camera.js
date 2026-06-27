import { CameraIRSchema } from '../ir/camera.js';
import { computeFingerprint } from '../utils/hash.js';
export class CameraBuilder {
    _id = '';
    _storyboardId = '';
    _sceneId = '';
    _aspectRatio = '16_9';
    _fingerprint = {
        pushPercent: 0,
        panPercent: 0,
        staticPercent: 100,
        pullPercent: 0,
    };
    _cameraProgram = [];
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
        this._cameraProgram.push(item);
        return this;
    }
    build() {
        if (this._cameraProgram.length > 2) {
            throw new Error("Camera program budget exceeded (Max 2 actions per scene)");
        }
        const rawContent = {
            storyboardId: this._storyboardId,
            sceneId: this._sceneId,
            aspectRatio: this._aspectRatio,
            cameraFingerprint: this._fingerprint,
            cameraProgram: this._cameraProgram,
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
        return CameraIRSchema.parse(compiled);
    }
}
