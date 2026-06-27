# Zenn Educational Animation Engine (ZEAE)
## Timeline Engine Specification (Temporal IR System) v1.0

```text
Document ID: ZEAE-DOC-08
Document Name: Timeline Engine Specification
Version: 1.0 Draft
Phase: Phase 7
Previous Document: 07_scene_composition_engine.md
Next Document: 09_camera_engine_specification.md
```

---

## 1. Purpose & Temporal Decoupling Rules

The **Timeline Engine (TE)** acts as the temporal coordinator pass in the ZEAE compiler pipeline. Its sole responsibility is to compile semantic, timed intent logs from the **Layout IR** and **Storyboard IR** into a unified, absolute **Timeline IR**.

To prevent architecture coupling, the TE operates under strict boundary limitations:
- **No Path Interpolation Math**: The TE does not calculate camera trajectory coordinate splines or visual asset translations.
- **No Easing/Easing Curve Logic**: The TE does not generate bezier curves or evaluate velocity variables. It defines the temporal boundary points ($T_{start}$ and $T_{duration}$).
- **Absolute Millisecond Base**: All compiled outputs are expressed as integer milliseconds relative to a global Master Clock.
- **Pure Temporal Scheduler**: It is a scheduling compiler, mapping parallel tracks of event envelopes onto a master timeline.

---

## 2. Integer-Millisecond Master Clock & Tracks

All event coordinates on the timeline are synchronized against a single, central **Master Clock** to avoid floating-point drift and ensure deterministic rendering across different frames-per-second (FPS) output targets.

### Timeline Track Model

The Timeline IR coordinates six independent, parallel event tracks. Tracks never modify each other; only the Timeline Compiler is permitted to synchronize them.

```
Master Clock (ms)
T_0 ──────────► 1000 ──────────► 2000 ──────────► 3000 ──────────► 4000 ──────────► 5000
│
├── Audio Track:      [=== Voiceover Narration ===]        [=== SFX Clip ===]
├── Caption Track:    [== Caption 1 ==]  [== Caption 2 ==]
├── Transition Track: [ Entry ]                                          [ Exit ]
├── Camera Intent:    [=== Static ===]                    [=== Zoom In ===]
├── Motion Intent:    [=== Asset 1 Enter ===]             [=== Label Focus ===]
└── Effects Track:                       [= Highlight =]
```

1. **Audio Track**: Stores raw narration voiceover segment triggers, pause boundaries, and sound effects (SFX) cues.
2. **Caption Track**: Subtitle block display windows mapped to narration timings.
3. **Transition Track**: Scene entry and exit wipe/fade durations.
4. **Camera Intent Track**: Timing boxes for camera zoom, dolly, pan, or static states (no coordinates).
5. **Motion Intent Track**: Entrance, exit, and highlight timing blocks for visual assets.
6. **Effects Track**: High-contrast outline highlights, pulse triggers, or particle system envelopes.

---

## 3. Timeline Compiler Passes

The TE processes spatial layouts and storyboard intent through six sequential compiler passes to resolve semantic dependencies into absolute millisecond coordinates.

```
[Layout IR]
    │
    ├── Pass 1: Narration Alignment (Map Voiceover Word Timestamps)
    │
    ├── Pass 2: Event Scheduling (Resolve Relative Anchors)
    │
    ├── Pass 3: Constraint Resolution (Enforce Boundary Limits)
    │
    ├── Pass 4: Cross-track Synchronization (Align Audio & Motion)
    │
    ├── Pass 5: Timeline Optimization (Minimize Latencies)
    │
    └── Pass 6: Timeline Validation (Verify VLS-MET Compliance) ──➔ [Timeline IR]
```

- **Pass 1: Narration Alignment**: Parse audio forced-alignment text outputs and map narration word timestamps to absolute millisecond values.
- **Pass 2: Event Scheduling**: Resolve semantic relative anchors (e.g. `anchorEventId: "CAP-004"`, `anchorOffsetMs: 150`) into absolute timestamps.
- **Pass 3: Constraint Resolution**: Enforce temporal constraints (`mustStartAfter`, `mustEndBefore`) based on Event Priorities (Critical vs. Normal).
- **Pass 4: Cross-track Synchronization**: Align SFX and motion triggers to coordinate accent colors and audio emphasis peaks.
- **Pass 5: Timeline Optimization**: Adjust overlapping non-critical events to minimize empty gap latency and maintain visual tempo bounds.
- **Pass 6: Timeline Validation**: Verify compliance with VLS timing metrics (e.g. `VLS-MET-001` subject visible within 300ms) and output the finalized Timeline IR.

---

## 4. Event Priority & Constraints

To resolve conflicts during compilation, events specify priorities and relational constraints.

### Event Priority
- **`critical`**: Cannot be shifted or compressed. Audio narration and caption tracks are always designated `critical`.
- **`normal`**: Can be delayed, advanced, or scaled in duration by the compiler to resolve overlap conflicts. Camera sweeps and decorative motions are designated `normal`.

### Temporal Constraints
- **`mustStartAfter`**: Event $B$ cannot begin until event $A$ has started ($T_{start, B} \ge T_{start, A}$).
- **`mustEndBefore`**: Event $B$ must complete before event $C$ begins ($T_{end, B} \le T_{start, C}$).
- **`overlapPermitted`**: Boolean flag indicating if concurrent execution on the same track is valid.

---

## 5. Event Groups

To simplify authoring, the Timeline Engine supports **Event Groups** (e.g. a "Reveal Sequence"). When a group is defined, the compiler coordinates its internal offsets as a single cohesive unit:

```json
{
  "groupId": "GRP-002",
  "groupType": "RevealSequence",
  "anchorEventId": "CAP-004",
  "events": [
    { "id": "CAM-004", "type": "camera_intent", "offsetMs": 0 },
    { "id": "MOT-005", "type": "motion_intent", "offsetMs": 150 },
    { "id": "SFX-002", "type": "audio_intent", "offsetMs": 150 }
  ]
}
```

---

## 6. Timeline IR Schema

The **Timeline IR** contains fully resolved, absolute millisecond timestamps.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TimelineIR",
  "type": "object",
  "properties": {
    "timelineId": { "type": "string" },
    "storyboardId": { "type": "string" },
    "totalDurationMs": { "type": "integer" },
    "fingerprint": {
      "type": "object",
      "properties": {
        "eventCount": { "type": "integer" },
        "trackCount": { "type": "integer" },
        "syncScore": { "type": "number" },
        "overlapCount": { "type": "integer" }
      },
      "required": ["eventCount", "trackCount", "syncScore", "overlapCount"]
    },
    "tracks": {
      "type": "object",
      "properties": {
        "audio": { "$ref": "#/definitions/TrackEvents" },
        "caption": { "$ref": "#/definitions/TrackEvents" },
        "transition": { "$ref": "#/definitions/TrackEvents" },
        "camera": { "$ref": "#/definitions/TrackEvents" },
        "motion": { "$ref": "#/definitions/TrackEvents" },
        "effects": { "$ref": "#/definitions/TrackEvents" }
      },
      "required": ["audio", "caption", "transition", "camera", "motion", "effects"]
    }
  },
  "required": ["timelineId", "storyboardId", "totalDurationMs", "fingerprint", "tracks"],
  "definitions": {
    "TrackEvents": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "eventId": { "type": "string" },
          "type": { "type": "string" },
          "startMs": { "type": "integer" },
          "durationMs": { "type": "integer" },
          "endMs": { "type": "integer" },
          "priority": { "type": "string", "enum": ["critical", "normal"] },
          "payload": {
            "type": "object",
            "properties": {
              "intent": { "type": "string" },
              "targetId": { "type": "string" },
              "intensity": { "type": "string" }
            },
            "required": ["intent"]
          }
        },
        "required": ["eventId", "type", "startMs", "durationMs", "endMs", "priority", "payload"]
      }
    }
  }
}
```

---

## 7. Timeline Validation Rules (Quality Gate QG-7)

The Video QA and Storyboard Reviewers validate the Timeline IR against the following checks:

* **`TLE-001` (Transition Overlap)**: Exit transition of Scene $A$ overlaps the entry transition of Scene $B$, causing rendering bleed.
* **`TLE-002` (Caption Timing Clashing)**: Multi-line captions overlap in absolute time, or caption start occurs after audio segment completion.
* **`TLE-003` (Subject Reveal Latency)**: Primary subject's `startMs` occurs $> 300\text{ ms}$ post scene entry, violating `VLS-COMP-005` attention times.
* **`TLE-004` (Narration Drift)**: Spoken word keyword trigger and visual reveal `startMs` delta exceeds $\pm 150\text{ ms}$, violating `VLS-SYNC-001`.
* **`TLE-005` (Timeline Underflow)**: Total scene duration between transition bounds is $< 1200\text{ ms}$, violating `VLS-MET-001`.
* **`TLE-006` (Decoupling Breach)**: Timeline IR contains spatial coordinates, asset source paths, or color hex parameters.
