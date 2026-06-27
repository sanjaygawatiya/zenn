import { CameraIR, CameraFingerprint, CameraProgramItem, CameraIRSchema } from '../ir/camera.js';
import { computeFingerprint } from '../utils/hash.js';

export class CameraBuilder {
  private _id: string = '';
  private _storyboardId: string = '';
  private _sceneId: string = '';
  private _aspectRatio: '16_9' | '9_16' = '16_9';
  private _fingerprint: CameraFingerprint = {
    pushPercent: 0,
    panPercent: 0,
    staticPercent: 100,
    pullPercent: 0,
  };
  private _cameraProgram: CameraProgramItem[] = [];

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

  fingerprint(fingerprint: CameraFingerprint): this {
    this._fingerprint = fingerprint;
    return this;
  }

  addProgramItem(item: CameraProgramItem): this {
    this._cameraProgram.push(item);
    return this;
  }

  build(): CameraIR {
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
