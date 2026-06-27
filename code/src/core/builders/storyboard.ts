import { StoryboardIR, StoryboardScene, StoryboardIRSchema } from '../ir/storyboard.js';
import { computeFingerprint } from '../utils/hash.js';

export class StoryboardBuilder {
  private _id: string = '';
  private _scenes: StoryboardScene[] = [];

  id(id: string): this {
    this._id = id;
    return this;
  }

  addScene(scene: StoryboardScene): this {
    this._scenes.push(scene);
    return this;
  }

  build(): StoryboardIR {
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
