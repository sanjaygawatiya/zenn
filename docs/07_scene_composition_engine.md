# Zenn Educational Animation Engine (ZEAE)
## Scene Composition Engine (SCE) Specification v1.0

```text
Document ID: ZEAE-DOC-07
Document Name: Scene Composition Engine Specification
Version: 1.0 Draft
Phase: Phase 6
Previous Document: 06_storyboard_blueprint_specification.md
Next Document: 08_timeline_engine_specification.md
```

---

## 1. Purpose & Spatial Decoupling Rules

The **Scene Composition Engine (SCE)** operates as the first compiler pass in the ZEAE execution pipeline. Its sole responsibility is to translate semantic, role-based scene nodes from the **Storyboard IR** into a deterministic, static **Layout IR**.

To maintain structural decoupling, the SCE operates under strict boundary limitations:
- **No Animation/Motion Knowledge**: The SCE has zero awareness of velocity curves, duration offsets, or entrance timelines. It compiles the *ideal static final frame* of a scene segment.
- **No Camera Knowledge**: The SCE compiles layouts in a static coordinate space. Panning vectors and zooming tracks are applied later by the Camera Engine.
- **Pure Optimization Solver**: The SCE behaves like a compiler optimization pass—solving constraints, calculating a layout cost function, and outputting normalized layout coordinates.

---

## 2. Normalized Dual Coordinate System

To ensure layouts render consistently across any final pixel resolution, the SCE calculates layouts using a normalized dual coordinate system.

```
Global Layout Space (Top-Left Origin)
(0.0, 0.0) ──────────────────────────► X
│
│       Local Object Space (Anchor-Centered)
│       +-------------------------+
│       |                         |
│       |        (0.5, 0.5)       |
│       |         Anchor          |
│       |                         |
│       +-------------------------+
▼
Y                                   (1.0, 1.0)
```

### 1. Global Layout Space
- **Origin `(0.0, 0.0)`**: Top-left corner of the display frame.
- **Limit `(1.0, 1.0)`**: Bottom-right corner of the display frame.
- Applies to all parent visual groups and independent background canvases.

### 2. Local Object Space
- **Anchor `(0.5, 0.5)`**: The geometric center of an individual asset's bounding box.
- All positioning coordinates (`positionX`, `positionY`) designate where the asset's center anchor is placed relative to its parent frame origin.

### 3. Parent/Child Relativity Rules
- Children (e.g. annotations, callout labels) are placed using offset coordinates relative to their parent's resolved center coordinate.
- Parent coordinate: `(X_parent, Y_parent)`
- Child coordinate: `(X_parent + X_offset, Y_parent + Y_offset)`
- If a parent asset shifts position, child offsets are preserved automatically without global recalculation.

---

## 3. Layout Compilation Passes

The SCE executes layout calculations sequentially through five distinct compiler passes.

```
[Storyboard IR]
      │
      ├──➔ Pass 1: Primary Subject Placement
      │
      ├──➔ Pass 2: Secondary Object Grouping
      │
      ├──➔ Pass 3: Annotations & Callouts Offset
      │
      ├──➔ Pass 4: Captions Safe Zone Allocation
      │
      └──➔ Pass 5: Validation & Cost Convergence ──➔ [Layout IR]
```

- **Pass 1: Primary Subject**: Position the `primary_subject` in the dominant grid zone based on the layout archetype.
- **Pass 2: Secondary Objects**: Place `secondary_subject` and `decorative` assets around the primary focal point, ensuring spacing limits are respected.
- **Pass 3: Annotations**: Resolve children offsets for labels and callout pointers relative to their mapped parent nodes.
- **Pass 4: Captions**: Verify safety zones at the bottom of the aspect ratio frame (bottom 10% in 16:9, bottom 15% in 9:16).
- **Pass 5: Validation & Convergence**: Execute the constraint solver loop, calculate the balance and complexity metrics, and generate the final Layout IR.

---

## 4. Iterative Constraint Solver

The constraint solver resolves spatial conflicts iteratively until layout convergence is reached.

```
  [Initialize Positions]
            │
            ▼
    [Resolve Critical]
            │
            ▼
   [Resolve Preferred]
            │
            ▼
   [Detect Collisions] ──(overlap detected)──➔ [Adjust Box Boundaries]
            │                                             │
      (no overlap)                                        │
            │                                             ▼
            ▼                                     [Recalculate Grid]
     [Optimize Cost]                                      │
            │                                             │
   (convergence target met) ◄─────────────────────────────┘
            │
            ▼
    [Validate Output] ──➔ [Layout IR]
```

1. **Initialize**: Place assets at default coordinates according to their archetype templates.
2. **Resolve Critical Constraints**: Enforce zero-tolerance boundaries (`mustRemainVisible == true`, safe zones padding, and caption space reservation).
3. **Resolve Preferred Constraints**: Apply focal alignments (e.g., centering subjects, maintaining ideal negative space ratio).
4. **Detect Collisions**: Compute bounding box intersections. If an overlap collision occurs, apply repulsive displacement vectors.
5. **Optimize**: Run loop iterations adjusting coordinates to minimize the visual cost function.
6. **Validate**: If a layout converges with a cost score below target limits, validate and write the Layout IR. If the loop fails to converge after 100 iterations, escalate to a human review request.

---

## 5. Composition Cost Function & Metrics

The quality of a compiled layout is determined quantitatively by a cost function. The SCE strives to minimize this score.

### The Cost Equation
$$\text{Layout Cost} = C_{collision} + C_{safe\_zone} + C_{attention\_drift} + C_{vcs} + C_{subject\_scale} + C_{balance\_score}$$

Where:
- $C_{collision}$: Infinite penalty if bounding boxes overlap.
- $C_{safe\_zone}$: High penalty if foreground elements clip the outer boundaries.
- $C_{attention\_drift}$: Evaluates the eye path sequence. Penalized if eye path lines cross.
- $C_{vcs}$: Visual Complexity Score penalty if complexity exceeds VLS thresholds.
- $C_{subject\_scale}$: Delta between measured area and VLS standard scale metrics.
- $C_{balance\_score}$: Weight deviation between left-to-right or top-to-bottom divisions.

### Balance Score Metric
$$\text{Balance Score} = 1.0 - \left| \sum W_{visual\_left} - \sum W_{visual\_right} \right|$$

Where:
- $W_{visual}$: Visual weight of asset $i$ (Heavy = 3, Medium = 2, Light = 1) multiplied by its normalized distance from the center axis.
- *An ideal layout maintains a Balance Score $\ge 0.80$.*

### Negative Space (Whitespace) Metric
- **Whitespace Ratio**: The ratio of unallocated pixel coordinates to total coordinate area:
$$\text{Whitespace Ratio} = 1.0 - \sum \text{Area}_{bounding\_boxes}$$
- The SCE enforces a whitespace target of `40% – 60%` (Landscape) and `50% – 70%` (Portrait) under rule `VLS-COMP-003`.

---

## 6. Layout IR Schema

The **Layout IR** is the final compiled static output of the SCE.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "LayoutIR",
  "type": "object",
  "properties": {
    "layoutId": { "type": "string" },
    "storyboardId": { "type": "string" },
    "sceneId": { "type": "string" },
    "aspectRatio": { "type": "string", "enum": ["16_9", "9_16"] },
    "metrics": {
      "type": "object",
      "properties": {
        "whitespaceRatio": { "type": "number" },
        "balanceScore": { "type": "number" },
        "visualComplexityScore": { "type": "number" },
        "layoutCost": { "type": "number" }
      },
      "required": ["whitespaceRatio", "balanceScore", "visualComplexityScore", "layoutCost"]
    },
    "elements": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "assetId": { "type": "string" },
          "role": { "type": "string" },
          "layer": { "type": "string" },
          "zindex": { "type": "integer" },
          "anchor": { "type": "string", "enum": ["center"] },
          "position": {
            "type": "object",
            "properties": {
              "x": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
              "y": { "type": "number", "minimum": 0.0, "maximum": 1.0 }
            },
            "required": ["x", "y"]
          },
          "dimensions": {
            "type": "object",
            "properties": {
              "width": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
              "height": { "type": "number", "minimum": 0.0, "maximum": 1.0 }
            },
            "required": ["width", "height"]
          },
          "parentAssetId": { "type": "string" },
          "offset": {
            "type": "object",
            "properties": {
              "x": { "type": "number" },
              "y": { "type": "number" }
            },
            "required": ["x", "y"]
          }
        },
        "required": ["assetId", "role", "layer", "zindex", "anchor", "position", "dimensions"]
      }
    }
  },
  "required": ["layoutId", "storyboardId", "sceneId", "aspectRatio", "metrics", "elements"]
}
```

---

## 7. Scene Composition Validation Rules (Quality Gate QG-6)

The Visual Reviewer evaluates the compiled Layout IR against the following criteria:

* **`SCE-001` (Unresolved Collision)**: Layout contains overlapping bounding boxes with conflicting layers, failing basic collision validation.
* **`SCE-002` (Whitespace Deficit)**: Total negative space falls below VLS limits.
* **`SCE-003` (Balance Violation)**: Left-to-right visual weight imbalance score is $< 0.70$.
* **`SCE-004` (Safe Zone Clipping)**: Resolved coordinates place foreground elements in display crop margins.
* **`SCE-005` (Focal Crossings)**: The calculated attention eye path crosses its own vector path, causing visual tracking confusion.
* **`SCE-006` (Decoupling Breach)**: Layout IR contains animation, duration, or keyframe triggers, violating separation of concerns.
