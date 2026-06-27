import { RenderIR, AssetRenderBlock, CameraRenderBlock, RenderIRSchema } from '../ir/render.js';
import { computeFingerprint } from '../utils/hash.js';

export class RenderBuilder {
  private _id: string = '';
  private _resolution = { width: 1920, height: 1080 };
  private _fps: 24 | 30 | 60 = 30;
  private _totalFrames: number = 0;
  private _assets: AssetRenderBlock[] = [];
  private _camera: CameraRenderBlock = { keyframes: [] };

  id(id: string): this {
    this._id = id;
    return this;
  }

  resolution(width: number, height: number): this {
    this._resolution = { width, height };
    return this;
  }

  fps(fps: 24 | 30 | 60): this {
    this._fps = fps;
    return this;
  }

  totalFrames(totalFrames: number): this {
    this._totalFrames = totalFrames;
    return this;
  }

  addAssetBlock(asset: AssetRenderBlock): this {
    this._assets.push(asset);
    return this;
  }

  cameraBlock(camera: CameraRenderBlock): this {
    this._camera = camera;
    return this;
  }

  build(): RenderIR {
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
