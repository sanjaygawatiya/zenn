# Zenn Educational Animation Engine (ZEAE)
## Motion Canvas Adapter Specification (Execution Layer) v1.0

```text
Document ID: ZEAE-DOC-13
Document Name: Motion Canvas Adapter Specification
Version: 1.0 Draft
Phase: Phase 12
Previous Document: 12_audio_pipeline_specification.md
Next Document: 14_production_orchestrator_specification.md
```

---

## 1. Purpose & Decoupling Boundaries

The **Motion Canvas Adapter** is the concrete execution layer of the Zenn Educational Animation Engine (ZEAE). It implements the abstract `IRenderAdapter` interface, consuming mathematically resolved **Render IR** and **Audio IR** and driving the `@motion-canvas/2d` runtime engine to export frames and audio.

### The "Zero Semantic Interpretation" Principle
The Motion Canvas Adapter has **zero semantic understanding**.
- It does **not** interpret camera motivations, layout intents, transition roles, animation categories, or educational goals.
- It treats input IR files as strictly **read-only and immutable**—it never writes back or modifies timelines.
- It operates purely as a mechanical rendering agent, converting raw coordinate streams, resolved asset paths, frame counts, and loudness gains into reactive signals and pixel draws.

---

## 2. Adapter Internal Architecture

To ensure high maintainability, the adapter is divided into five isolated internal components:

```
[Render IR + Audio IR]
         │
         ├──➔ [SceneBuilder] ──────────➔ Sets up base node tree hierarchy
         │
         ├──➔ [SignalResolver] ────────➔ Generates reactive createSignal tweens
         │
         ├──➔ [FrameExporter] ─────────➔ Orchestrates canvas drawing and PNG writes
         │
         ├──➔ [AudioMuxer] ────────────➔ Resolves tracks and executes FFmpeg merges
         │
         └──➔ [VideoExporter] ─────────➔ Encodes final frame sequence to target MP4
```

---

## 3. Visual Node Mapping Matrix

The `SceneBuilder` instantiates `@motion-canvas/2d` components based on the resolved `layer` and `resolvedUri` specified inside the `AssetRenderBlock` of the Render IR.

| Resolved Asset Type | Motion Canvas 2D Component | Instantiation Configuration |
| :--- | :--- | :--- |
| **SVG Vector Graphic** | `<SVG>` | Resolves using `src` pointer, setting vector precision caching options. |
| **PNG/JPG Raster Graphic** | `<Img>` | Resolves using file paths, mapping `width` and `height` properties. |
| **Text Element** | `<Txt>` | Standard typographical styling matching `VLS-TYPO` presets. |
| **Layout Group** | `<Node>` | Blank grouping container used to nest children for relative parenting. |

---

## 4. Signal Pipeline & Easing Resolver

The `SignalResolver` converts absolute keyframe tracks into reactive Motion Canvas signals.
- **Dynamic Signals**: Instantiates `createSignal` hooks for properties: position (`x`, `y`), scale (`scaleX`, `scaleY`), rotation, and opacity.
- **Bezier Tweens**: Keyframe transitions are executed using generator functions driven by custom cubic bezier interpolations matching the resolved four-element array `[x1, y1, x2, y2]`.
- **Suppressing Continuous Motion**: Resolves camera tracks to coordinate pauses, binding suppression signals to idle asset containers.

---

## 5. Post-Render Audio Muxing (FFmpeg Pipeline)

Because Motion Canvas operates as a visual frame-buffer exporter, the adapter coordinates post-process audio merging.

### Stage 1: Frame Buffer Writing
The `FrameExporter` exports the canvas sequence to disk as sequentially numbered PNG buffers:
`tmp/frames/frame_%06d.png`

### Stage 2: Audio Muxing & Encoding
The `AudioMuxer` processes the Audio IR track list, executing a multi-input FFmpeg thread to mix narration, SFX, ambient, and music paths with their respective gain envelope nodes:

```bash
ffmpeg -y \
  -framerate 30 -i tmp/frames/frame_%06d.png \
  -i narration.wav -i sfx_mix.wav -i ambient.wav -i music.wav \
  -filter_complex "[1:a]volume=1.0[a1]; [2:a]volume=1.0[a2]; [3:a]volume=0.5[a3]; [4:a]volume=0.25[a4]; [a1][a2][a3][a4]amix=inputs=4:duration=longest[a]" \
  -map 0:v -map "[a]" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k \
  output.mp4
```

---

## 6. Adapter Capability & Diagnostics Manifests

Each execution pass generates diagnostic and metadata manifests to ensure reproducibility.

### Adapter Capability Manifest
Defines the technical features supported by the active adapter instance:
```json
{
  "adapterId": "ZEAE-MC-ADAPTER",
  "capabilities": {
    "vectorGraphics": true,
    "rasterGraphics": true,
    "text": true,
    "audio": true,
    "videoExport": true,
    "maxResolution": "3840x2160",
    "supportsTransparency": true
  }
}
```

### Adapter Diagnostics Report
Logged upon render completion:
```json
{
  "renderId": "RND-9821-4820",
  "diagnostics": {
    "framesRendered": 1800,
    "droppedFrames": 0,
    "nodeCount": 42,
    "peakMemoryBytes": 536870912,
    "renderDurationMs": 42300,
    "ffmpegDurationMs": 8400
  }
}
```

---

## 7. Adapter Validation Rules (Quality Gate QG-12)

The Video QA Agent checks compiled output using the following tests:

* **`ADP-001` (Node Class Mismatch)**: Attempting to instantiate a raster bitmap (`.png`) inside an `<SVG>` node container.
* **`ADP-002` (Signal Value Drift)**: Dynamic signal values drift $> \pm 0.5\text{ pixels}$ or scale metrics drift $> \pm 0.01$ from the absolute values locked in the Render IR.
* **`ADP-003` (FFmpeg Process Timeout)**: Muxing or encoding exceeds the maximum allowable rendering budget.
* **`ADP-004` (Audio Phase Alignment Error)**: Audio tracks drift $> \pm 1$ frame relative to the primary visual animation markers.
* **`ADP-005` (Missing Frame Buffer Export)**: Missing or corrupt files inside the exported PNG frame directory.

---

## 8. Feature-Frozen Declaration

With the completion of the Motion Canvas Adapter Specification, **the ZEAE core compiler architecture is declared Feature-Frozen**.
- **Rule**: No new compiler passes, new intermediate representations, or architectural layout modifications may be introduced.
- **Next Phase Progression**: The implementation of the Orchestrator and Autonomous Studio layers is postponed. The engineering team will transition directly to implementing a minimal vertical slice prototype:
  - Hardcode one static storyboard (`SCN-0001`).
  - Compile it end-to-end to export a single 10-second educational MP4 clip ("Phantom Phone Vibration").
  - Validate the visual rendering output against Zenn's visual guidelines before writing production code for automation.
