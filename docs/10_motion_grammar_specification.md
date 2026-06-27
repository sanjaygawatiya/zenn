# Zenn Educational Animation Engine (ZEAE)
## Motion Grammar Specification (Visual Movement System) v1.0

```text
Document ID: ZEAE-DOC-10
Document Name: Motion Grammar Specification
Version: 1.0 Draft
Phase: Phase 9
Previous Document: 09_camera_grammar_specification.md
Next Document: 11_render_engine_architecture.md
```

---

## 1. Purpose & Motion Ground Rules

The **Motion Grammar Specification** defines the rules of visual movement and animation behavior for assets in ZEAE educational animations. 

Following the ZEAE Project Constitution, the engine enforces a strict directive: **Never animate an asset without educational purpose (Function over Decoration).** Motion exists to guide the viewer's eye along the attention path, emphasize keywords in the narration, and depict logical transformations—never to serve as cosmetic decoration.

To maintain separation of concerns and portability across renderers, the Motion Grammar operates under these structural constraints:
- **No Mathematical Transforms**: The Motion Grammar does not declare physical values (e.g., `x: 100px`, `scaleX: 1.5`, `opacity: 0`).
- **Strictly Semantic Vocabulary**: Animation instructions are declared using abstract verbs (Enter, Highlight, Morph) and speed/direction parameters. The downstream Motion Engine compiles these into parametric keyframe curves.

---

## 2. Motion Categories & State Machine

Animations are classified into three functional categories, each subjected to different scheduling and budget rules.

### Motion Categories
1. **Structural Motion**: Controls asset presence and structure.
   - **`ENTER`**: Introduces an asset (e.g., slide-in, fade, draw-in).
   - **`EXIT`**: Removes an asset from the frame (e.g., slide-out, shrink, fade-out).
   - **`MORPH`**: State transformation (e.g., cell splitting, shape melting, cross-section reveal).
2. **Attention Motion**: Temporarily draws viewer focus.
   - **`EMPHASIZE`**: Pulse, scale peak, or directional shake synchronized to audio keyword emphasis.
   - **`HIGHLIGHT`**: Visual halo, outline sweep, or cursor pointer draw-in.
3. **Ambient Motion**: Maintains organic presence without drawing attention.
   - **`IDLE_CREEP`**: Slow, continuous scale drift or rotation.

### Motion State Machine
Reviewer agents enforce the following state transition matrix:

```
[Default] ──➔ ENTER ──➔ HOLD ──➔ IDLE_CREEP ──➔ EXIT ──➔ [Destroyed]
                       │            ▲
                       ▼            │
                   EMPHASIZE ───────┘
```
*Note: Any direct transition from `Default` to `EMPHASIZE` or `EXIT` without a preceding `ENTER` sequence is rejected.*

---

## 3. Transition Groups & Motion Suppression

Transitions and ambient motions follow strict coordination rules to prevent visual clutter.

### Semantic Transition Groups
Overlapping entry and exit transitions are mapped as a single, coordinated Transition Group rather than independent tracks.
```json
{
  "transitionGroupId": "TRG-001",
  "type": "CROSS_DISSOLVE",
  "durationMs": 500,
  "members": [
    { "targetAssetId": "asset_A", "action": "EXIT" },
    { "targetAssetId": "asset_B", "action": "ENTER" }
  ]
}
```

### Background Motion Suppression (`MOT-007`)
To minimize cognitive load, the engine applies automatic ambient motion suppression:
- **Rule**: Whenever any camera movement action (e.g., `PUSH_SOFT`, `PAN_GUIDED`, `FOLLOW`) is active on the Camera Track, the Motion Compiler MUST suspend all `IDLE_CREEP` animations on the Motion Track.
- Ambient creep animations automatically resume only after the camera reaches a `LOCK` or `HOLD` state.

---

## 4. Motion Budgets & Priorities

Reviewer agents reject motion timelines that exceed structural budgets.

### Motion Budgets

| Budget Parameter | Landscape (16:9) Limit | Portrait (9:16) Limit | Architectural Reason |
| :--- | :---: | :---: | :--- |
| **Simultaneous Animations** | Max `3` concurrent. | Max `2` concurrent. | Prevents chaotic, split-attention frames (`VLS-MOTION-002`). |
| **Total Animated Objects** | Max `5` unique per scene. | Max `3` unique per scene. | Controls visual density limits. |
| **Event Density** | Max `48` events / minute. | Max `36` events / minute. | Prevents rapid visual exhaustion. |

### Motion Priority Tiers
Every motion program declares a priority:
- **`Critical`**: Core structural animations (`ENTER`, `EXIT`, `MORPH`). Cannot be dropped or delayed.
- **`Normal`**: Attention highlights (`HIGHLIGHT`, `EMPHASIZE`). Can be shifted to resolve timing collisions.
- **`Decorative`**: Ambient creep (`IDLE_CREEP`). Dropped immediately if the scene budget is exceeded.

---

## 5. Motion Ingest-to-IR Compilation Passes

The Motion Grammar functions as a compiler pass converting the Timeline IR into a **Motion Program (Motion IR)**.

```
[Timeline IR]
      │
      ├── Pass 1: Category Classification (Separate structural, attention, and ambient)
      │
      ├── Pass 2: Budget Evaluation (Drop decorative if count > budget)
      │
      ├── Pass 3: Transition Grouping (Combine overlapping exits/enters)
      │
      └── Pass 4: Easing Mapping & Validation (Attach semantic speed tokens) ──➔ [Motion IR]
```

### Speed Grammar Tokens
Animations use abstract speed scales, resolved by the Motion Engine:
- **`SLOW`**: Duration $1000 - 2000\text{ ms}$.
- **`MEDIUM`**: Duration $500 - 1000\text{ ms}$.
- **`FAST`**: Duration $200 - 500\text{ ms}$.
- **`SNAP`**: Duration $\le 200\text{ ms}$.

---

## 6. Motion IR Schema (Motion Program)

The **Motion IR** is the compiled output of the Motion Grammar pass.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MotionIR",
  "type": "object",
  "properties": {
    "motionIrId": { "type": "string" },
    "storyboardId": { "type": "string" },
    "sceneId": { "type": "string" },
    "aspectRatio": { "type": "string", "enum": ["16_9", "9_16"] },
    "fingerprint": {
      "type": "object",
      "properties": {
        "enterPercent": { "type": "number" },
        "highlightPercent": { "type": "number" },
        "morphPercent": { "type": "number" },
        "idlePercent": { "type": "number" },
        "exitPercent": { "type": "number" }
      },
      "required": ["enterPercent", "highlightPercent", "morphPercent", "idlePercent", "exitPercent"]
    },
    "motionProgram": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "programId": { "type": "string" },
          "targetAssetId": { "type": "string" },
          "category": { "type": "string", "enum": ["Structural", "Attention", "Ambient"] },
          "priority": { "type": "string", "enum": ["Critical", "Normal", "Decorative"] },
          "intentToken": { "type": "string", "enum": ["ENTER", "EXIT", "EMPHASIZE", "MORPH", "HIGHLIGHT", "IDLE_CREEP"] },
          "direction": { "type": "string", "enum": ["none", "left", "right", "top", "bottom"] },
          "speed": { "type": "string", "enum": ["SLOW", "MEDIUM", "FAST", "SNAP"] },
          "startMs": { "type": "integer" },
          "durationMs": { "type": "integer" },
          "motivation": { "type": "string", "enum": ["explain", "compare", "reveal", "emphasize", "transition", "maintain_presence"] }
        },
        "required": ["programId", "targetAssetId", "category", "priority", "intentToken", "direction", "speed", "startMs", "durationMs", "motivation"]
      }
    }
  },
  "required": ["motionIrId", "storyboardId", "sceneId", "aspectRatio", "fingerprint", "motionProgram"]
}
```

---

## 7. Motion Validation Rules (Quality Gate QG-9)

The Storyboard Reviewer and Video QA Reviewer evaluate the Compiled Motion IR against these checks:

* **`MOT-001` (Decorative/Unmotivated Movement)**: Animation events lack a narrative `motivation` enum or target asset ID.
* **`MOT-002` (Simultaneous Budget Overrun)**: More concurrent animations display than permitted by the format budget (`VLS-MOTION-002`).
* **`MOT-003` (Invalid State Transition)**: Mapped events violate the Motion State Machine (e.g. triggering an exit without prior entry).
* **`MOT-004` (Narration Synchronization Drift)**: Accent/Highlight animation start times drift $> \pm 150\text{ ms}$ from audio keywords.
* **`MOT-005` (Unresolved Target Asset)**: Target asset ID does not exist in the sibling Layout IR.
* **`MOT-006` (Decoupling Violation)**: Motion IR contains raw translate coordinates, opacity floats, rotation angles, or Bezier values.
* **`MOT-007` (Suppression Failure)**: Idle creep animation remains active during camera movement tracks.
