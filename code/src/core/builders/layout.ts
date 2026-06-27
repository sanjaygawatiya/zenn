import { LayoutIR, LayoutAsset, LayoutIRSchema } from '../ir/layout.js';
import { computeFingerprint } from '../utils/hash.js';

export class LayoutBuilder {
  private _id: string = '';
  private _storyboardId: string = '';
  private _sceneId: string = '';
  private _aspectRatio: '16_9' | '9_16' = '16_9';
  private _layoutAssets: LayoutAsset[] = [];

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

  aspectRatio(aspectRatio: '16_9' | '9_16'): this {
    this._aspectRatio = aspectRatio;
    return this;
  }

  addAsset(asset: LayoutAsset): this {
    this._layoutAssets.push(asset);
    return this;
  }

  build(): LayoutIR {
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
