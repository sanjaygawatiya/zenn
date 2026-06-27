import { RenderIRSchema } from '../ir/render.js';
import { computeFingerprint } from '../utils/hash.js';
export class RenderBuilder {
    _id = '';
    _resolution = { width: 1920, height: 1080 };
    _fps = 30;
    _totalFrames = 0;
    _assets = [];
    _camera = { keyframes: [] };
    id(id) {
        this._id = id;
        return this;
    }
    resolution(width, height) {
        this._resolution = { width, height };
        return this;
    }
    fps(fps) {
        this._fps = fps;
        return this;
    }
    totalFrames(totalFrames) {
        this._totalFrames = totalFrames;
        return this;
    }
    addAssetBlock(asset) {
        this._assets.push(asset);
        return this;
    }
    cameraBlock(camera) {
        this._camera = camera;
        return this;
    }
    build() {
        const rawContent = {
            renderId: this._id,
            resolution: this._resolution,
            fps: this._fps,
            totalFrames: this._totalFrames,
            assets: this._assets,
            camera: this._camera,
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
        return RenderIRSchema.parse(compiled);
    }
}
