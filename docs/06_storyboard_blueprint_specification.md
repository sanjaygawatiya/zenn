# Zenn Educational Animation Engine (ZEAE)
## Storyboard Blueprint Specification (Storyboard IR) v1.0

```text
Document ID: ZEAE-DOC-06
Document Name: Storyboard Blueprint Specification
Version: 1.0 Draft
Phase: Phase 5
Previous Document: 05_master_review_framework.md
Next Document: 07_scene_composition_engine.md
```

---

## 1. Purpose & Compliance Framework

The **Storyboard Blueprint Specification** defines the schema and execution rules for the Storyboard Intermediate Representation (Storyboard IR). 

The Storyboard IR serves as the **single executable contract** between planning (Reference Ingestion, Knowledge Graph, Script Planner) and execution (Scene Composition, Camera Engine, Motion Engine, Renderer). 

To ensure complete portability and decoupling, the Storyboard IR is strictly **declarative and semantic**. It contains:
- **No pixel coordinates** or screen dimensions.
- **No absolute file paths** to visual assets.
- **No renderer-specific APIs** (e.g., no raw Canvas, WebGL, or Motion Canvas syntax).

Instead, it describes storytelling intent, visual relationships, alignment constraints, timing nodes, semantic camera paths, and semantic animation steps. Downstream renderers are responsible for translating this abstract representation into physical coordinates and frames.

---

## 2. Directory Layout & Registry

Storyboard blueprints are version-controlled in the workspace under the `storyboards/` folder.

### Directory Structure
```
zenn/
  storyboards/
    storyboard_index.json       # Master index of active storyboards
    storyboard_001.json         # Executable Storyboard IR file
    storyboard_002.json
```

### `storyboard_index.json` Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "StoryboardIndex",
  "type": "object",
  "properties": {
    "version": { "type": "string" },
    "storyboards": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "storyboardId": { "type": "string" },
          "title": { "type": "string" },
          "scenesCount": { "type": "integer" },
          "targetAspectRatios": {
            "type": "array",
            "items": { "type": "string", "enum": ["16_9", "9_16"] }
          },
          "lastTraceId": { "type": "string" }
        },
        "required": ["storyboardId", "title", "scenesCount", "targetAspectRatios", "lastTraceId"]
      }
    }
  },
  "required": ["version", "storyboards"]
}
```

---

## 3. Storyboard Root Schema

The root of a Storyboard IR document contains metadata, global styling requirements, and the timeline array of scene nodes.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "StoryboardIR",
  "type": "object",
  "properties": {
    "storyboardId": { "type": "string" },
    "metadata": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "author": { "type": "string" },
        "narrationAudioId": { "type": "string" },
        "estimatedDurationMs": { "type": "integer" },
        "theme": { "type": "string" }
      },
      "required": ["title", "narrationAudioId", "estimatedDurationMs", "theme"]
    },
    "scenes": {
      "type": "array",
      "items": { "$ref": "#/definitions/SceneNode" }
    }
  },
  "required": ["storyboardId", "metadata", "scenes"]
}
```

---

## 4. Scene Node Schema & Definitions

A scene node represents a continuous educational segment, demarcated by entry and exit transitions.

### Scene Node Schema Diagram
```
+---------------------------------------------------------------------------------+
| Scene SCN-0001                                                                  |
|   ├── Objective: "Explain Dopamine pathways"                                    |
|   ├── Timings: Start=0ms, End=6200ms                                            |
|   ├── Transitions: Entry={ type: fade }, Exit={ type: cross_dissolve }          |
|   ├── Layout Archetype: Comparison                                              |
|   ├── Assets: [ { id: subject_01, role: primary_subject, layer: foreground } ]  |
|   ├── Camera: { action: zoom_in, target: subject_01, intensity: medium }        |
|   └── Caption: [ "Dopamine acts as a chemical messenger." ]                      |
+---------------------------------------------------------------------------------+
```

### Definitions Schema
```json
{
  "definitions": {
    "SceneNode": {
      "type": "object",
      "properties": {
        "sceneId": { "type": "string", "pattern": "^SCN-[0-9]{4}$" },
        "objective": { "type": "string" },
        "educationalIntent": { "type": "string", "enum": ["Teach", "Compare", "Warn", "Reveal", "Demonstrate", "Summarize", "Question", "ProvokeCuriosity"] },
        "targetEmotion": { "type": "string", "enum": ["Curiosity", "Fear", "Discovery", "Relief", "Neutral"] },
        "layoutArchetype": { "type": "string", "enum": ["Question", "Comparison", "Timeline", "CrossSection", "Callout", "ZoomReveal", "CauseEffect", "Memory", "Danger", "Process", "Transformation"] },
        "timings": {
          "type": "object",
          "properties": {
            "startMs": { "type": "integer" },
            "endMs": { "type": "integer" }
          },
          "required": ["startMs", "endMs"]
        },
        "transitions": {
          "type": "object",
          "properties": {
            "entry": { "$ref": "#/definitions/TransitionObject" },
            "exit": { "$ref": "#/definitions/TransitionObject" }
          },
          "required": ["entry", "exit"]
        },
        "assets": {
          "type": "array",
          "items": { "$ref": "#/definitions/AssetObject" }
        },
        "camera": { "$ref": "#/definitions/CameraObject" },
        "captions": {
          "type": "array",
          "items": { "type": "string" }
        }
      },
      "required": ["sceneId", "objective", "educationalIntent", "targetEmotion", "layoutArchetype", "timings", "transitions", "assets", "camera", "captions"]
    },
    "TransitionObject": {
      "type": "object",
      "properties": {
        "type": { "type": "string", "enum": ["none", "fade", "cross_dissolve", "slide_x", "slide_y", "radial_wipe"] },
        "durationMs": { "type": "integer" },
        "easing": { "type": "string" }
      },
      "required": ["type", "durationMs", "easing"]
    },
    "AssetObject": {
      "type": "object",
      "properties": {
        "assetId": { "type": "string" },
        "role": { "type": "string", "enum": ["primary_subject", "secondary_subject", "background", "annotation", "callout", "decorative", "ui_overlay"] },
        "layer": { "type": "string", "enum": ["background", "midground", "foreground", "overlay", "caption", "effects"] },
        "visualStyle": { "type": "string" },
        "constraints": {
          "type": "object",
          "properties": {
            "mustRemainVisible": { "type": "boolean" },
            "minimumScreenTimeMs": { "type": "integer" },
            "mayOverlapCaption": { "type": "boolean" }
          },
          "required": ["mustRemainVisible", "minimumScreenTimeMs", "mayOverlapCaption"]
        },
        "motions": {
          "type": "array",
          "items": { "$ref": "#/definitions/MotionObject" }
        }
      },
      "required": ["assetId", "role", "layer", "visualStyle", "constraints", "motions"]
    },
    "CameraObject": {
      "type": "object",
      "properties": {
        "action": { "type": "string", "enum": ["static", "zoom_in", "zoom_out", "pan", "tilt", "dolly_back"] },
        "targetAssetId": { "type": "string" },
        "intensity": { "type": "string", "enum": ["low", "medium", "high"] },
        "durationMs": { "type": "integer" }
      },
      "required": ["action", "intensity", "durationMs"]
    },
    "MotionObject": {
      "type": "object",
      "properties": {
        "intent": { "type": "string", "enum": ["enter", "exit", "focus", "morph", "idle_creep"] },
        "direction": { "type": "string", "enum": ["none", "left", "right", "top", "bottom"] },
        "speed": { "type": "string", "enum": ["slow", "medium", "fast"] },
        "startTimeOffsetMs": { "type": "integer" },
        "durationMs": { "type": "integer" }
      },
      "required": ["intent", "direction", "speed", "startTimeOffsetMs", "durationMs"]
    }
  }
}
```

---

## 5. Voiceover Narration Synchronization Rules

To align animation phases with narrator speech patterns, the Storyboard IR defines timed triggers matching exact word positions in the subtitle captions.

- **Trigger Offsets**: All asset motion timings and camera shifts must align with voiceover (VO) events using relative offsets (`startTimeOffsetMs` relative to scene $T_0$, or linked directly to word tags).
- **Caption Triggers**: Subtitles are synchronized using forced-alignment timestamps. For every captions block, the storyboard engine maps `voiceoverWordSync`:
```json
{
  "captionSync": {
    "sceneId": "SCN-0001",
    "wordIndex": 12,
    "spokenWord": "dopamine",
    "triggerAnimationMs": 1420
  }
}
```

---

## 6. Storyboard Validation Rules (Quality Gate QG-5)

The Storyboard Reviewer validates storyboards before they transition to execution. Every validation error triggers a specific validation ID tag.

* **`SBP-001` (Scene Objective Missing)**: Every scene node must declare a descriptive `objective` string.
* **`SBP-002` (Asset Role Missing)**: Every asset mapped in the layout list must possess a valid, explicit asset `role`.
* **`SBP-003` (Primary Subject Missing)**: Every scene must contain exactly one asset designated as the `primary_subject`.
* **`SBP-004` (Constitutional Visual Violation)**: Assets must not declare absolute pixel widths or coordinates.
* **`SBP-005` (VLS Object Budget Exceeded)**: Scene asset count exceeds format limit (Max 7 in 16:9, Max 5 in 9:16 under `VLS-COMP-004`).
* **`SBP-006` (VCS Limits Violated)**: Computed visual complexity score exceeds threshold limits (`VLS-COMP-008`).
* **`SBP-007` (Safe Zone Violation)**: Assets in foreground/overlay layers violate display safe boundary padding rules (`VLS-COMP-007`).
* **`SBP-008` (Failed Pattern Detection)**: Mapped layout configurations trigger veto conditions defined in the Failed Patterns Registry (e.g. `FP-002: Unmotivated Panning`).
* **`SBP-009` (Timing Underflow)**: Scene duration falls below hard boundary limit (`VLS-MET-001` hard minimum of $1.2\text{ s}$).
