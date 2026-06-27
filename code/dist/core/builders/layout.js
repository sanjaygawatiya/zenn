import { LayoutIRSchema } from '../ir/layout.js';
import { computeFingerprint } from '../utils/hash.js';
export class LayoutBuilder {
    _id = '';
    _storyboardId = '';
    _sceneId = '';
    _aspectRatio = '16_9';
    _layoutAssets = [];
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
    addAsset(asset) {
        this._layoutAssets.push(asset);
        return this;
    }
    build() {
        const rawContent = {
            storyboardId: this._storyboardId,
            sceneId: this._sceneId,
            aspectRatio: this._aspectRatio,
            layoutAssets: this._layoutAssets,
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
        return LayoutIRSchema.parse(compiled);
    }
}
