import { StoryboardIRSchema } from '../ir/storyboard.js';
import { computeFingerprint } from '../utils/hash.js';
export class StoryboardBuilder {
    _id = '';
    _scenes = [];
    id(id) {
        this._id = id;
        return this;
    }
    addScene(scene) {
        this._scenes.push(scene);
        return this;
    }
    build() {
        const rawContent = {
            scenes: this._scenes,
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
        return StoryboardIRSchema.parse(compiled);
    }
}
