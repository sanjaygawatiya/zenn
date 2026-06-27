import { StoryboardIR } from '../ir/storyboard.js';
import { LayoutIR, LayoutAsset } from '../ir/layout.js';
import { LayoutBuilder } from '../builders/layout.js';
import { CompilerContext } from './context.js';
import { Result } from '../utils/result.js';
import { deepFreeze } from '../utils/freeze.js';
import { CompilerPass } from './pass.js';
import { CompilerError } from '../utils/errors.js';

export class StoryboardToLayoutCompiler implements CompilerPass<StoryboardIR, LayoutIR> {
  readonly id = 'CP-001';
  readonly version = '1.0';

  compile(storyboard: Readonly<StoryboardIR>, context: CompilerContext): Result<Readonly<LayoutIR>, CompilerError[]> {
    const res = StoryboardToLayoutCompiler.compile(context, storyboard);
    if (res.success) {
      return { success: true, data: res.data };
    }
    const errors = res.errors.map(msg => new CompilerError(msg, 'CP-001-ERR', 'ERROR', 'QG-10', 'CP-001'));
    return { success: false, errors };
  }

  static compile(context: CompilerContext, storyboard: StoryboardIR): Result<LayoutIR, string[]> {
    const startTime = Date.now();
    context.metrics.increment('CP-001-Runs');

    const scene = storyboard.scenes[0];
    if (!scene) {
      context.diagnostics.add('CP-001-P01', 'ERROR', 'Storyboard contains no scenes');
      return { success: false, errors: ['Storyboard contains no scenes'] };
    }

    const hasPrimary = scene.assets.some(a => a.role === 'primary_subject');
    if (!hasPrimary) {
      context.diagnostics.add('CP-001-P01', 'ERROR', 'Missing primary_subject asset');
      return { success: false, errors: ['Missing primary_subject asset'] };
    }

    const layoutAssets: LayoutAsset[] = [];
    for (const asset of scene.assets) {
      let centerX = 0.5;
      let centerY = 0.5;
      let width = 0.3;
      let height = 0.3;

      if (asset.role === 'primary_subject') {
        centerX = 0.5;
        centerY = 0.5;
        width = 0.3;
        height = 0.6;
      } else if (asset.role === 'label') {
        centerX = 0.5;
        centerY = 0.85;
        width = 0.8;
        height = 0.1;
      }

      layoutAssets.push({
        assetId: asset.assetId,
        anchorX: 0.5,
        anchorY: 0.5,
        centerX,
        centerY,
        width,
        height,
        zIndex: asset.role === 'primary_subject' ? 10 : 20,
      });
      context.metrics.increment('CP-001-AssetsRegistered');
    }

    const primaryAsset = layoutAssets.find(a => a.zIndex === 10);
    if (primaryAsset) {
      for (const asset of layoutAssets) {
        if (asset.assetId !== primaryAsset.assetId) {
          (asset as any).parentId = primaryAsset.assetId;
        }
      }
    }

    for (const asset of layoutAssets) {
      const left = asset.centerX - asset.width / 2;
      const right = asset.centerX + asset.width / 2;
      const top = asset.centerY - asset.height / 2;
      const bottom = asset.centerY + asset.height / 2;

      if (left < 0.0 || right > 1.0 || top < 0.0 || bottom > 1.0) {
        context.diagnostics.add('CP-001-P04', 'ERROR', `Asset ${asset.assetId} clips safe boundary`);
        return { success: false, errors: [`Asset ${asset.assetId} clips safe boundary`] };
      }

      const margin = 0.02;
      if (left < margin || (1.0 - right) < margin || top < margin || (1.0 - bottom) < margin) {
        context.diagnostics.add('CP-001-P04', 'WARNING', `Asset ${asset.assetId} violates minimum margin`);
      }
    }

    try {
      const builder = new LayoutBuilder()
        .id(`LAY-${storyboard.id}`)
        .storyboardId(storyboard.id)
        .sceneId(scene.sceneId)
        .aspectRatio(context.config.aspectRatio);

      for (const asset of layoutAssets) {
        builder.addAsset(asset);
      }

      const layoutIr = builder.build();
      const duration = Date.now() - startTime;
      context.metrics.set('CP-001-DurationMs', duration);

      deepFreeze(layoutIr);

      return { success: true, data: layoutIr };
    } catch (err: any) {
      context.diagnostics.add('CP-001-P05', 'FATAL', `Assembly failure: ${err.message}`);
      return { success: false, errors: [err.message] };
    }
  }
}
