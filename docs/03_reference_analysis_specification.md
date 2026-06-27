# Zenn Educational Animation Engine (ZEAE)
## Reference Analysis Specification (Reference Intelligence System) v1.0

```text
Document ID: ZEAE-DOC-003
Document Name: Reference Analysis Specification
Version: 1.0 Draft
Phase: Phase 2
Previous Document: 02_visual_language_system.md
Next Document: 04_master_review_framework.md
```

---

## 1. Introduction: The Reference Compiler Model

In the Zenn Educational Animation Engine (ZEAE), reference video ingestion is not a passive cataloging task. It is treated as a **compiler front-end**. 

The goal of the Reference Analysis Specification is to transform unstructured reference materials (video frames, raw audio, text subtitles) into a highly structured, machine-readable **Abstract Visual Blueprint**. The Storyboard Engine and Motion Canvas Renderer then consume this blueprint to generate new, original content that inherits the underlying communication rules without copying the visual assets.

```
Unstructured Input                     Compiler Processing                Structured Output
+-----------------+     Ingestion      +-------------------+  Blueprint   +-----------------+
|  Original MP4   | ➔➔➔➔ Pipeline ➔➔➔➔ | Reference Engine  | ➔➔➔➔➔➔➔➔➔➔ ➔ | Scene Blueprint |
+-----------------+                    +-------------------+  Generation  +-----------------+
```

---

## 2. Ingestion Pipeline

The ingestion pipeline converts raw source video into standardized intermediate assets.

```
Raw MP4 Video
      │
      ├──➔ Metadata Extraction ──➔ metadata.json
      │
      ├──➔ Audio Separation ─────➔ audio.wav ──➔ Whisper transcript alignment ──➔ caption_analysis.json
      │
      ├──➔ Frame Extraction ─────➔ Frame Sequence (PNG) ──➔ Optical Flow ───────➔ scene_index.json
```

1. **Stage 1: Metadata Extraction**: FFmpeg reads the container headers to verify pixel dimensions, codec formats, audio sample rates, and constant frame rates.
2. **Stage 2: Audio Separation**: The audio stream is demuxed into a mono WAV format ($16\text{ kHz}$, $16\text{-bit}$ PCM) for optimal NLP transcription.
3. **Stage 3: Forced-Alignment Transcript Generation**: Whisper scans the WAV file to align spoken words with exact start and end timestamps.
4. **Stage 4: Frame Extraction**: FFmpeg outputs high-fidelity, uncompressed PNG files at the original frame rate.
5. **Stage 5: Scene Detection**: Visual and audio indicators divide the frame sequence into distinct scenes.

---

## 3. Scene Detection & Pacing Limits

Visual scene boundaries represent changes in visual context. Pacing limits ensure the engine remains within readable time boundaries.

### Scene Boundary Indicators
* **Visual Cuts (Hard Cuts)**: Detected when the color histogram delta between adjacent frames exceeds a critical threshold ($\Delta H \ge 0.15$).
* **Fades/Dissolves**: Identified by tracking the mean frame luminance curve. A gradual, monotonic decrease to zero (fade-out) followed by an increase (fade-in).
* **Camera Path Breaks**: Marked when the optical flow velocity vector suddenly shifts magnitude or reverses direction.
* **Semantic Silence Cuts**: Triggered when a pause in narration longer than $800\text{ ms}$ aligns with a shift in background color or text labels.

### Pacing Constraints
* **Hard Minimum Duration**: `1.2 seconds`. Any visual change occurring faster than $1.2\text{ s}$ is classified as a transition effect, not a separate scene.
* **Preferred Scene Duration**: `2.0 – 6.0 seconds`. Matches typical human comprehension latency.
* **Hard Maximum Duration**: `12.0 seconds`. Scenes exceeding this duration without a camera transition or object reveal trigger a warning during ingestion.

---

## 4. Keyframe & Frame Graph Strategy

To analyze visual layouts efficiently, the system extracts four distinct keyframe types and links them into a relational **Frame Graph**.

```
+------------------+     Camera Motion (Ease-Out)     +------------------+     Dissolve Cut     +------------------+
|  Keyframe A      | ➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔ |  Keyframe B      | ➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔ |  Keyframe C      |
|  (Scene Entry)   |                                  |  (Camera Target) |                    |  (Next Scene)    |
+------------------+                                  +------------------+                    +------------------+
```

### Keyframe Typology
1. **Scene Keyframe (SK)**: Captured at $T_0 + 300\text{ ms}$ (post-transition). Represents the initial layout balance.
2. **Camera Keyframe (CK)**: Captured at the apex of camera pans or zooms. Defines travel limits.
3. **Composition Keyframe (CoK)**: Captured at the point of maximum visual density, containing all labels and elements.
4. **Transition Keyframe (TK)**: Captured at the exact midpoint of a dissolve or wipe transition.

### Frame Graph Schema
Every scene must output a graph structure defining state transitions:
```json
{
  "sceneGraph": {
    "nodes": [
      { "id": "SK-01", "type": "scene_entry", "timestamp": 0.3 },
      { "id": "CK-01", "type": "camera_target", "timestamp": 2.4 },
      { "id": "CoK-01", "type": "peak_composition", "timestamp": 4.1 }
    ],
    "edges": [
      { "source": "SK-01", "target": "CK-01", "transition": "camera_zoom_ease_in_out" },
      { "source": "CK-01", "target": "CoK-01", "transition": "label_fade_in" }
    ]
  }
}
```

---

## 5. Audio & Narration Analysis

Audio analysis structures non-visual narrative features.

- **Narration Timing**: Maps spoken terms to millisecond boundaries, establishing synchronization constraints for visual reveals.
- **Emphasis / Pitch Detection**: Highlights spikes in decibel levels and pitch shifts, identifying keywords that require visual scale highlights or accent color triggers.
- **SFX & Music Zones**: Tracks background music tempo (BPM) and logs the entry of sound effects (whooshes, pops, rings), linking them to keyframe transition points.

---

## 6. Visual Extraction & Asset Reports

Per scene, the visual analyzer compiles a detailed catalog of visible assets and estimates their styles.

### Asset Extraction Variables
* **Dominant Subject**: Segmented object boundary with largest area pixel count.
* **Asset Style Tagging**: Classifies assets into categories: `Flat Illustration`, `Line Art`, `Hand-Drawn`, `Structured Diagram`, `Text Label`.
* **Visual Weight Classification**:
  - `Heavy`: Large solid elements, high-contrast objects.
  - `Medium`: Average icons, connectors.
  - `Light`: Thin boundary lines, labels.

### Asset Extraction Report Schema Example
```json
{
  "sceneId": "scene_04",
  "detectedAssets": [
    {
      "assetId": "asset_04_01",
      "class": "human_portrait",
      "estimatedStyle": "Flat Illustration",
      "visualWeight": "Heavy",
      "scalePercent": 0.42,
      "styleConfidence": 0.95
    },
    {
      "assetId": "asset_04_02",
      "class": "callout_arrow",
      "estimatedStyle": "Line Art",
      "visualWeight": "Light",
      "scalePercent": 0.08,
      "styleConfidence": 0.91
    }
  ]
}
```

---

## 7. Camera Timeline Specifications

Camera paths are logged as explicit parametric timelines. 

```json
{
  "cameraTimeline": [
    {
      "eventIndex": 1,
      "startTimeMs": 300,
      "durationMs": 1500,
      "action": "zoom_in",
      "parameters": {
        "startScale": 1.0,
        "endScale": 1.25,
        "focalPoint": { "x": 0.35, "y": 0.5 }
      },
      "easingCurve": "ease_in_out",
      "motivation": "VLS-CAM-001: Discovery highlight of central node"
    }
  ]
}
```

---

## 8. Educational Intent & Narrative Graphs

Every scene must declare its educational intent and place itself on a narrative sequence.

### Educational Intent Classification
The analyzer outputs a probability distribution over the allowed intent categories:
```json
{
  "primaryIntent": {
    "intent": "Teach",
    "confidence": 0.88
  },
  "alternatives": [
    { "intent": "Demonstrate", "confidence": 0.11 },
    { "intent": "Reveal", "confidence": 0.01 }
  ]
}
```

### Narrative Graph
The sequence of scenes is compiled into a high-level narrative flow structure:
```
[Question] ➔ [Discovery] ➔ [Explanation] ➔ [Evidence] ➔ [Conclusion]
```
This graph ensures that visual pacing accelerates during Discovery and stabilizes during Explanation.

---

## 9. Scene Fingerprint Schema

The Scene Fingerprint is a compact, indexed metadata tag summarizing all quantitative parameters of a scene.

```json
{
  "fingerprint": {
    "sceneId": "video002_scene_03",
    "durationSeconds": 4.8,
    "primaryCameraAction": "slow_pan_right",
    "visualTempo": "Medium",
    "subjectCount": 4,
    "visualWeightRatio": "balanced",
    "educationalIntent": "Compare",
    "dominantEmotion": "Curiosity",
    "visualComplexityScore": 9.5,
    "dominantColorHue": "#1e3a8a",
    "motionComplexity": "standard_ease"
  }
}
```

---

## 10. Blueprint Generation Engine

The Blueprint Generator compiles raw, segmented scene records into an abstract, structured **Visual Blueprint**. 

### Raw Analysis vs. Blueprint Abstraction
- **Raw Analysis**: Logs coordinates, exact pixel widths, specific timing offsets, and raw transcript text.
- **Abstract Blueprint**: Extracts the underlying rules. Instead of hardcoding position, it specifies composition styles (e.g., `Comparison Archetype`, `Dolly-Back transition`, `WCAG-compliant accent balance`).

### Output Blueprint Example
```json
{
  "blueprintId": "BP-video001-scene-04",
  "archetype": "Comparison",
  "intent": "Compare",
  "emotion": "Curiosity",
  "aspectRatios": {
    "16_9": {
      "primarySubjectScale": 0.40,
      "negativeSpace": 0.50,
      "maxObjects": 5
    },
    "9_16": {
      "primarySubjectScale": 0.60,
      "negativeSpace": 0.60,
      "maxObjects": 3
    }
  },
  "visualRulesEnforced": [
    "VLS-COMP-001",
    "VLS-CAM-001",
    "VLS-COLOR-001"
  ],
  "timelinePhases": {
    "sceneOpenMs": 0,
    "focusLockMs": 400,
    "revealMs": 1000,
    "explanationMs": 1800,
    "confirmationMs": 4800,
    "transitionMs": 5800
  }
}
```

---

## 11. Folder Manifest & Unified JSON Schemas

The following schemas define the output formats generated for every video in the corpus.

### `metadata.json` Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "VideoMetadata",
  "type": "object",
  "properties": {
    "videoId": { "type": "string" },
    "resolution": {
      "type": "object",
      "properties": {
        "width": { "type": "integer" },
        "height": { "type": "integer" }
      },
      "required": ["width", "height"]
    },
    "frameRate": { "type": "number" },
    "durationSeconds": { "type": "number" },
    "audioSampleRateHz": { "type": "integer" },
    "version": { "type": "string" }
  },
  "required": ["videoId", "resolution", "frameRate", "durationSeconds", "audioSampleRateHz", "version"]
}
```

### `scene_index.json` Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SceneIndex",
  "type": "object",
  "properties": {
    "videoId": { "type": "string" },
    "scenes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "sceneId": { "type": "string" },
          "startTimeSeconds": { "type": "number" },
          "endTimeSeconds": { "type": "number" },
          "transitionInType": { "type": "string" }
        },
        "required": ["sceneId", "startTimeSeconds", "endTimeSeconds", "transitionInType"]
      }
    }
  },
  "required": ["videoId", "scenes"]
}
```

### `camera_analysis.json` Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CameraAnalysis",
  "type": "object",
  "properties": {
    "videoId": { "type": "string" },
    "cameraTracks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "sceneId": { "type": "string" },
          "motions": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "action": { "type": "string", "enum": ["static", "zoom_in", "zoom_out", "pan_left", "pan_right", "tilt_up", "tilt_down"] },
                "confidence": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
                "durationMs": { "type": "integer" }
              },
              "required": ["action", "confidence", "durationMs"]
            }
          }
        },
        "required": ["sceneId", "motions"]
      }
    }
  },
  "required": ["videoId", "cameraTracks"]
}
```

### `composition_analysis.json` Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CompositionAnalysis",
  "type": "object",
  "properties": {
    "videoId": { "type": "string" },
    "compositions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "sceneId": { "type": "string" },
          "primarySubjectAreaRatio": { "type": "number" },
          "negativeSpaceRatio": { "type": "number" },
          "objectCount": { "type": "integer" },
          "visualComplexityScore": { "type": "number" }
        },
        "required": ["sceneId", "primarySubjectAreaRatio", "negativeSpaceRatio", "objectCount", "visualComplexityScore"]
      }
    }
  },
  "required": ["videoId", "compositions"]
}
```

---

## 12. Reference Analysis Reviewer Specifications

The **Reference Analysis Reviewer** is an AI agent or process whose role is to inspect and validate the output of the ingestion pipeline before it is compiled into a blueprint.

### Reviewer Mission
To ensure all JSON files in the reference video directory match the real video parameters, conform to VLS rules, and achieve validation coverage.

### Manifest Consumed
- `scene_index.json`
- `camera_analysis.json`
- `composition_analysis.json`
- `caption_analysis.json`
- `audio_analysis.json`
- `motion_analysis.json`

### Reviewer Checks & Validation Log Rules
1. **Timestamp Check**: Ensure no overlapping timestamps exist across the scene timelines.
2. **Confidence Threshold**: Flag any property with a confidence score $< 0.80$ for manual verification.
3. **Audit Trails**: Confirm the `review_report.md` has signed off on the educational intent and emotional choreography classifications.
4. **VCS Validation**: Recalculate and verify the visual complexity scores.
