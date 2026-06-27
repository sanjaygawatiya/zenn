# Zenn Educational Animation Engine (ZEAE)
## Camera Grammar Specification (Cinematography System) v1.0

```text
Document ID: ZEAE-DOC-09
Document Name: Camera Grammar Specification
Version: 1.0 Draft
Phase: Phase 8
Previous Document: 08_timeline_engine_specification.md
Next Document: 10_motion_grammar_specification.md
```

---

## 1. Purpose & Cinematic Ground Rules

The **Camera Grammar Specification** defines the rules of cinematic language and camera behavior in ZEAE educational animations. 

Following the ZEAE Project Constitution, the camera operates under a strict, non-negotiable directive: **Never move the camera without a narrative motivation.** The camera is a tool to control viewer focus, direct attention, and reinforce comprehension—never to decorate.

To ensure separation of concerns and portability across renderers, the Camera Grammar operates under these structural rules:
- **No Coordinate Transforms**: The Camera Grammar does not declare physical offsets (e.g., `x: 120px`, `y: -40px`) or explicit scale multipliers (`zoom: 1.5x`).
- **Strictly Semantic Vocabulary**: Camera instructions are expressed using abstract shot types, framing bounds, and movement intents. The downstream Camera Engine compiles these into parametric coordinate tracks, while the Renderer resolves absolute zooms based on asset qualities.

---

## 2. Cinematic Camera Vocabulary & Grammar Tokens

The grammar restricts camera behavior to seven standard, pre-approved **Grammar Tokens**. Custom bezier curves or random panning curves are prohibited at this layer.

### Easing Grammar Tokens

| Grammar Token | Intended Semantic Behavior | Internal Easing Implementation |
| :--- | :--- | :--- |
| **`LOCK`** | Fixed, static camera state. | No camera offset or zoom shifts. |
| **`HOLD`** | Absolute zero velocity period between movements. | Flat timing track interval. |
| **`PUSH_SOFT`** | Gradual, slow zoom-in to isolate a detail. | Slow ease-in-out Cubic Bezier `(0.42, 0, 0.58, 1)`. |
| **`PULL_SOFT`** | Gradual, slow zoom-out to show contextual scale. | Slow ease-in-out Cubic Bezier `(0.42, 0, 0.58, 1)`. |
| **`PAN_GUIDED`** | Smooth horizontal or vertical shift from target to target. | Balanced ease-in-out Bezier `(0.25, 0.1, 0.25, 1)`. |
| **`SNAP`** | Immediate, rapid focal zoom to create a highlight. | Fast ease-out Bezier `(0.16, 1, 0.3, 1)`. |
| **`FOLLOW`** | Real-time tracking following a moving primary subject. | Adaptive dampening interpolation. |

---

## 3. Shot Types & Framing Rules

To capture visual relationships, camera programs use defined shot types and framing grids instead of raw coordinates.

### Cinematic Shot Types
- **Macro**: Focuses on a micro-detail of an asset (e.g., a single component).
- **Extreme Close**: Focuses on a single focal element.
- **Close**: Isolates the primary subject.
- **Medium**: Displays the primary subject and its immediate supporting labels.
- **Wide**: Displays the entire scene composition group.
- **Overview**: Displays all assets and the outer background margins.

### Framing Grid Rules
- **Centered**: Align focal target to center anchor `(0.5, 0.5)`.
- **RuleOfThirds**: Align focal target to grid centroids `(0.33, 0.33)`, `(0.66, 0.33)`, etc.
- **Diagonal**: Align target along a diagonal line index.
- **Split**: Frame two distinct targets on opposite sides of a splitting plane.
- **GoldenRatio**: Align focal target to golden ratio coordinates `(0.618, 0.382)`.

---

## 4. Camera Motivation & Budgets

Reviewer agents reject camera movements that violate narrative motivation or exceed complexity budgets.

### Narrative Motivation Log
Every camera action must specify its underlying educational motivation:
- **`Reveal`**: Pull back to expose context or reveal a hidden asset.
- **`Inspect`**: Zoom in to investigate a complex visual detail.
- **`Compare`**: Pan to alternate focus between subject $A$ and subject $B$.
- **`Follow`**: Keep a moving target asset centered in the frame.
- **`Summarize`**: Slow pull back to overview framing.
- **`Transition`**: Dolly back or pan out to exit the scene.

### Camera Budget Constraints
- **Max Programs Per Scene**: Capped at `2` (e.g., a static entry phase followed by a single push-soft discovery zoom).
- **Minimum Static Hold**: Every camera movement must be followed by a minimum `1000 ms` `HOLD` or `LOCK` state to allow the viewer to process the focal change and read subtitles.

---

## 5. Camera Ingest-to-IR Compilation Passes

The Camera Grammar functions as a compiler pass converting the Timeline IR into a **Camera Program (Camera IR)**.

```
[Timeline IR]
      │
      ├── Pass 1: Motivation Extraction (Validate intent vs. script context)
      │
      ├── Pass 2: Shot Type Mapping (Map Close/Wide to target asset scales)
      │
      ├── Pass 3: Framing Alignment (Assign target coordinates based on grids)
      │
      └── Pass 4: Easing Assignment & Validation (Attach Grammar Tokens) ──➔ [Camera IR]
```

### Dynamic Zoom Resolution
The Camera Engine and Renderer calculate the actual zoom scale factor during compilation to prevent pixelation. If the Camera Grammar requests a `Macro` shot of a raster asset, the engine references the asset class resolution:
- **SVG Vector Assets**: Allow up to `6.0x` zoom magnification.
- **High-Res PNG Assets**: Allow up to `3.0x` zoom magnification.
- **Raster Illustration**: Allow up to `2.0x` zoom magnification.
- *If a zoom path exceeds the asset threshold, the engine automatically dampens the scale factor and adjusts the camera framing.*

---

## 6. Camera IR Schema (Camera Program)

The **Camera IR** is the compiled output of the Camera Grammar pass.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CameraIR",
  "type": "object",
  "properties": {
    "cameraIrId": { "type": "string" },
    "storyboardId": { "type": "string" },
    "sceneId": { "type": "string" },
    "aspectRatio": { "type": "string", "enum": ["16_9", "9_16"] },
    "fingerprint": {
      "type": "object",
      "properties": {
        "pushPercent": { "type": "number" },
        "panPercent": { "type": "number" },
        "staticPercent": { "type": "number" },
        "pullPercent": { "type": "number" }
      },
      "required": ["pushPercent", "panPercent", "staticPercent", "pullPercent"]
    },
    "cameraProgram": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "programId": { "type": "string" },
          "startMs": { "type": "integer" },
          "durationMs": { "type": "integer" },
          "action": { "type": "string", "enum": ["LOCK", "HOLD", "PUSH_SOFT", "PULL_SOFT", "PAN_GUIDED", "SNAP", "FOLLOW"] },
          "motivation": { "type": "string", "enum": ["Reveal", "Inspect", "Compare", "Follow", "Summarize", "Transition"] },
          "shotType": { "type": "string", "enum": ["Macro", "ExtremeClose", "Close", "Medium", "Wide", "Overview"] },
          "framingRule": { "type": "string", "enum": ["Centered", "RuleOfThirds", "Diagonal", "Split", "GoldenRatio"] },
          "targetAssetId": { "type": "string" },
          "intensity": { "type": "string", "enum": ["low", "medium", "high"] }
        },
        "required": ["programId", "startMs", "durationMs", "action", "motivation", "shotType", "framingRule", "targetAssetId", "intensity"]
      }
    }
  },
  "required": ["cameraIrId", "storyboardId", "sceneId", "aspectRatio", "fingerprint", "cameraProgram"]
}
```

---

## 7. Camera Validation Rules (Quality Gate QG-8)

The Storyboard Reviewer and Video QA Reviewer evaluate the Compiled Camera IR against these checks:

* **`CAM-001` (Unmotivated Movement)**: Camera actions fail to specify an authorized `motivation` enum or lack a target asset ID.
* **`CAM-002` (Velocity Limit Breach)**: Zoom/pan duration maps to speeds exceeding VLS limits (`VLS-CAM-001`).
* **`CAM-003` (Display Boundary Clipping)**: Framing offsets place critical assets outside crop safe zones (`VLS-COMP-007`).
* **`CAM-004` (Unresolved Target ID)**: Mapped target asset ID does not exist in the parent Layout IR document.
* **`CAM-005` (Motion Budget Exceeded)**: Scene contains more than two active camera program sequences.
* **`CAM-006` (Decoupling Violation)**: Camera IR declares raw pixel offsets, canvas transformations, or Bezier float coordinates.
* **`CAM-007` (Resolution Pixelation Risk)**: Zoom scale factor resolved by the engine exceeds the asset resolution ceiling.
