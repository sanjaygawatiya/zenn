import { MotionIR, MotionFingerprint, MotionProgramItem, MotionIRSchema } from '../ir/motion.js';
import { computeFingerprint } from '../utils/hash.js';

export class MotionBuilder {
  private _id: string = '';
  private _storyboardId: string = '';
  private _sceneId: string = '';
  private _aspectRatio: '16_9' | '9_16' = '16_9';
  private _fingerprint: MotionFingerprint = {
    enterPercent: 0,
    highlightPercent: 0,
    morphPercent: 0,
    idlePercent: 100,
    exitPercent: 0,
  };
  private _motionProgram: MotionProgramItem[] = [];

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

  fingerprint(fingerprint: MotionFingerprint): this {
    this._fingerprint = fingerprint;
    return this;
  }

  addProgramItem(item: MotionProgramItem): this {
    this._motionProgram.push(item);
    return this;
  }

  build(): MotionIR {
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
