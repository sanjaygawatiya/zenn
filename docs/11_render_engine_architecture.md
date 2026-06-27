# Zenn Educational Animation Engine (ZEAE)
## Render Engine Architecture Specification v1.0

```text
Document ID: ZEAE-DOC-11
Document Name: Render Engine Architecture
Version: 1.0 Draft
Phase: Phase 10
Previous Document: 10_motion_grammar_specification.md
Next Document: 12_audio_pipeline_specification.md
```

---

## 1. Purpose & Decoupling Boundaries

The **Render Engine** acts as the compiler back-end for the Zenn Educational Animation Engine (ZEAE). Its sole responsibility is to translate the four upstream semantic Intermediate Representations (**Layout IR**, **Timeline IR**, **Camera IR**, and **Motion IR**) into a single, mathematically resolved **Render IR**.

```
Upstream Semantic IRs
  ├── Layout IR ──┐
  ├── Timeline IR ┼──➔ [Render Engine Compiler] ──➔ Render IR ──➔ [IRenderAdapter] ──➔ Video
  ├── Camera IR ──┼           (Zero Creative Authority)
  └── Motion IR ──┘
```

### The "Zero Creative Authority" Principle
To prevent architectural drift and maintain system determinism, the Render Engine operates under a strict, non-negotiable rule: **The Render Engine has zero creative authority.**
- It does **not** decide composition rules, timing offsets, camera motivations, or animation meanings.
- It acts purely as a mathematical transformer—resolving normalized scales into absolute pixels, converting time offsets into absolute frame numbers, and mapping semantic tokens to explicit Bézier equations.

---

## 2. Six-Pass Compilation Pipeline

The Render Engine processes the input IR files sequentially through six compiler passes.

---

### Pass 1: Coordinate Resolution
Converts normalized coordinates $[0.0, 1.0]$ in the Layout IR into absolute pixel coordinates based on the designated target resolution (e.g. $1920 \times 1080$).
- **Anchor Offset Math**: Resolves local object anchors `(0.5, 0.5)` relative to parent bounds.
- **Relativity Resolution**: Recursively resolves parent/child coordinate dependencies to assign final global pixel offsets.

---

### Pass 2: Asset Resolution
Matches logical asset IDs from the storyboard against the active Asset Registry.
- Verifies format availability (SVG vectors vs. PNG bitmaps).
- Enforces the **Three-Level Asset Fallback Policy** if assets are missing.

---

### Pass 3: Camera Resolution
Translates semantic Camera IR programs (e.g. `PUSH_SOFT`, `PAN_GUIDED`) into absolute camera positioning offsets and focal scales based on the target resolution and active zoom ceilings.
- Maps camera action tokens to target assets, calculating final coordinate sweeps.

---

### Pass 4: Motion Resolution
Converts semantic Motion IR programs (`ENTER`, `EMPHASIZE`, `HIGHLIGHT`) into target coordinates, resolved opacity keyframe sweeps, and rotation ranges.

---

### Pass 5: Timeline Merge
Unifies the independently defined tracks (Audio, Caption, Transition, Camera, Motion, Effects) into a single frame-based timeline.
- Converts milliseconds into absolute frame numbers using the target output FPS:
$$T_{frame} = \text{round}\left(\frac{t_{ms} \cdot \text{FPS}}{1000}\right)$$
- Enforces background motion suppression rules (suspending idle creep during camera movements).

---

### Pass 6: Render IR Generation
Packs the compiled assets, coordinates, frame timings, and bezier keys into a nested JSON structure (Render IR) and generates a compilation manifest report.

---

## 3. Three-Level Asset Fallback Policy

If an asset fails to resolve during compiling, the compiler applies three levels of recovery before aborting.

1. **Level 1: Equivalent Substitution (Automatic)**:
   - *Behavior*: If the requested style variant (e.g. `brain_isolation_dark.svg`) is missing, substitute the default style variant (e.g. `brain_default.svg`) automatically.
2. **Level 2: Semantic Placeholder (Warning)**:
   - *Behavior*: If the asset category matches (e.g. `human_portrait`) but no file exists, substitute a generic silhouette placeholder asset, logging a compiler warning.
3. **Level 3: Critical Failure (Abort)**:
   - *Behavior*: If the missing asset is designated as the `primary_subject` or has a constraint of `mustRemainVisible == true`, the compiler immediately aborts compilation and logs a `RND-001` error.

---

## 4. Minimal Backend-Agnostic `IRenderAdapter` Contract

The Render Engine does not execute rendering directly. It outputs a Render IR which is consumed by a renderer adapter. The adapter interface contract contains zero dependencies on specific framework APIs (e.g. no React hooks or Motion Canvas classes).

```typescript
interface IRenderAdapter {
  /** Initialize the renderer window and canvas contexts */
  initialize(width: number, height: number, fps: number): Promise<void>;

  /** Cache assets from resolved URI list into render memory */
  loadAssets(manifest: Array<{ assetId: string; fileUri: string }>): Promise<void>;

  /** Instantiate static objects on their base layer Z-indices */
  instantiateScene(layout: Array<{ assetId: string; zIndex: number }>): void;

  /** Apply camera zooms, pans, and targets on absolute frame limits */
  applyCameraProgram(cameraTimeline: Array<CameraFrameEvent>): void;

  /** Bind resolved translations and opacities onto target assets */
  applyMotionProgram(motionTimeline: Array<MotionFrameEvent>): void;

  /** Compile frame range into raw image/audio buffer streams */
  renderFrameRange(startFrame: number, endFrame: number): Promise<FrameBufferStream>;

  /** Invoke export scripts to compile raw buffers into MP4 container */
  exportVideo(outputPath: string): Promise<void>;

  /** Clear memory caches and terminate render context */
  cleanup(): Promise<void>;
}
```

---

## 5. Render IR Schema

The **Render IR** represents the mathematically resolved, ready-to-execute timeline. It organizes data into nested render blocks (Scene ➔ Layer ➔ Asset).

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "RenderIR",
  "type": "object",
  "properties": {
    "renderId": { "type": "string" },
    "resolution": {
      "type": "object",
      "properties": {
        "width": { "type": "integer" },
        "height": { "type": "integer" }
      },
      "required": ["width", "height"]
    },
    "fps": { "type": "integer", "enum": [24, 30, 60] },
    "totalFrames": { "type": "integer" },
    "assets": {
      "type": "array",
      "items": { "$ref": "#/definitions/AssetRenderBlock" }
    },
    "camera": { "$ref": "#/definitions/CameraRenderBlock" }
  },
  "required": ["renderId", "resolution", "fps", "totalFrames", "assets", "camera"],
  "definitions": {
    "AssetRenderBlock": {
      "type": "object",
      "properties": {
        "assetId": { "type": "string" },
        "resolvedUri": { "type": "string" },
        "layer": { "type": "string", "enum": ["background", "midground", "foreground", "overlay", "caption", "effects"] },
        "zIndex": { "type": "integer" },
        "keyframes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "frame": { "type": "integer" },
              "transform": {
                "type": "object",
                "properties": {
                  "x": { "type": "number" },
                  "y": { "type": "number" },
                  "scaleX": { "type": "number" },
                  "scaleY": { "type": "number" },
                  "rotation": { "type": "number" },
                  "opacity": { "type": "number", "minimum": 0.0, "maximum": 1.0 }
                },
                "required": ["x", "y", "scaleX", "scaleY", "rotation", "opacity"]
              },
              "bezier": {
                "type": "array",
                "items": { "type": "number" },
                "minItems": 4,
                "maxItems": 4
              }
            },
            "required": ["frame", "transform", "bezier"]
          }
        }
      },
      "required": ["assetId", "resolvedUri", "layer", "zIndex", "keyframes"]
    },
    "CameraRenderBlock": {
      "type": "object",
      "properties": {
        "keyframes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "frame": { "type": "integer" },
              "x": { "type": "number" },
              "y": { "type": "number" },
              "zoom": { "type": "number" },
              "bezier": {
                "type": "array",
                "items": { "type": "number" },
                "minItems": 4,
                "maxItems": 4
              }
            },
            "required": ["frame", "x", "y", "zoom", "bezier"]
          }
        }
      },
      "required": ["keyframes"]
    }
  }
}
```

---

## 6. Render Engine Validation Rules (Quality Gate QG-10)

The QA Tester and Video QA Reviewer evaluate the Compiled Render IR against these checks:

* **`RND-001` (Asset Resolution Failure)**: A required asset ID fails to resolve to a valid file path, or triggers a Level 3 fallback abort.
* **`RND-002` (Out-of-Bounds Bounding Box)**: Resolved absolute pixel coordinates place a critical asset completely outside the display resolution frame bounds.
* **`RND-003` (FPS Conversion Drift)**: Frame rounding calculations result in a total video duration delta $> 1$ frame relative to the original audio track duration.
* **`RND-004` (Creative Authority Leak)**: The Render Engine attempts to adjust timing offsets or layout relationships that differ from upstream IRs.
* **`RND-005` (Layer Collision)**: Two assets occupying the same layer segment are assigned identical Z-index metrics, risking rendering order overlap jitter.
* **`RND-006` (Bézier Curve Overrun)**: Resolved Bézier control points fall outside the valid normalized range `[0.0, 1.0]`.
