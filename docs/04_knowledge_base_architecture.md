# Zenn Educational Animation Engine (ZEAE)
## Knowledge Base Architecture (Knowledge Graph System) v1.0

```text
Document ID: ZEAE-DOC-004
Document Name: Knowledge Base Architecture
Version: 1.0 Draft
Phase: Phase 3
Previous Document: 03_reference_analysis_specification.md
Next Document: 05_master_review_framework.md
```

---

## 1. Introduction: The Knowledge Graph Paradigm

The Zenn Educational Animation Engine (ZEAE) does not treat learned information as static, isolated database files. Instead, the engine stores visual language patterns, camera motions, and storytelling sequences in a structured **Knowledge Graph**.

Videos, scripts, and storyboards are classified as **sources**, while the extracted connections represent **the product**. Within this graph, nodes represent concepts (such as Archetypes, Visual Rules, and Emotions) and edges represent structural associations, weights, and confidence links.

```
       [Archetype: Comparison] ──(implied)──➔ [Emotion: Curiosity]
                 │                                     │
            (enforces)                             (triggers)
                 ▼                                     ▼
      [Rule: VLS-COMP-001 v2]                 [Camera: Slow Push]
                 │                                     │
           (provenance)                          (provenance)
                 ▼                                     ▼
        [Source: video003]                    [Source: video003]
```

---

## 2. Directory Layout & Version Control

To facilitate development scaling and debugging across approximately 20 reference videos, the Knowledge Graph is stored in a Git-backed directory structure under the project root. This enables clear diff tracking, transaction rollbacks, and reproducible builds.

### Directory Structure
```
zenn/
  knowledge_base/
    corpus.json               # Global corpus registry index
    failed_patterns/          # Mistake registry
      FP-001.json
      FP-002.json
    rules/                    # Versioned VLS rule specs
      VLS-COMP-001.json
      VLS-COMP-002.json
    blueprints/                # Reusable abstract blueprints
      archetype_comparison/
      archetype_timeline/
    fingerprints/             # Scene fingerprints
      fingerprint_index.json
    ir/                       # Intermediate representation files
      video001_ir.json
```

### Version Control Policy
- **Minor Versions (x.Y)**: Incremented automatically when new instances (evidence) are appended to a rule or blueprint, increasing its confidence metrics.
- **Major Versions (X.y)**: Incremented when a rule's boundary conditions change (e.g. area ratios altered by a structural review decision).
- **Rollback Rules**: Storyboards are locked to specific rule versions (e.g. `VLS-COMP-001 v2.1`). This prevents downstream rendering breakages when global rules are updated.

---

## 3. Intermediate Representation (IR) Schema

The Intermediate Representation (IR) bridges raw, quantitative frame metadata with qualitative, abstract blueprints. It preserves physical geometries and velocities before compiling them into abstract terms.

### `ir_schema.json`
```json
{
  "sceneIr": {
    "sceneId": "scene_video001_04",
    "timeline": {
      "startFrame": 1200,
      "endFrame": 1560,
      "fps": 60
    },
    "visualGeometry": {
      "spatialGrid": "rule_of_thirds",
      "focalCentroid": { "x": 0.33, "y": 0.5 },
      "elements": [
        {
          "id": "node_01",
          "boundingBox": { "x": 0.1, "y": 0.2, "width": 0.45, "height": 0.6 },
          "style": "flat_vector",
          "contrastRatio": 8.2
        }
      ]
    },
    "motionVectors": {
      "camera": {
        "trajectory": "pan_x",
        "velocityCurve": [0.0, 0.25, 0.72, 1.0]
      }
    }
  }
}
```

---

## 4. Global Corpus Index (`corpus.json`)

The `corpus.json` file is the master index of the reference intelligence library. The renderer queries this index to resolve locations instead of scanning directory folders.

### `corpus.json` Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CorpusIndex",
  "type": "object",
  "properties": {
    "version": { "type": "string" },
    "totalReferenceVideos": { "type": "integer" },
    "globalBlueprintsCount": { "type": "integer" },
    "globalFingerprintsCount": { "type": "integer" },
    "videos": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "videoId": { "type": "string" },
          "topics": {
            "type": "array",
            "items": { "type": "string" }
          },
          "sceneCount": { "type": "integer" },
          "averageVcs": { "type": "number" },
          "visualStyleTag": { "type": "string" }
        },
        "required": ["videoId", "topics", "sceneCount", "averageVcs", "visualStyleTag"]
      }
    }
  },
  "required": ["version", "totalReferenceVideos", "globalBlueprintsCount", "globalFingerprintsCount", "videos"]
}
```

---

## 5. Knowledge Provenance & Rule Versioning

Every rule and blueprint in the Knowledge Graph must trace back to its origin.

```json
{
  "ruleId": "VLS-COMP-001",
  "version": "2.1",
  "state": "Accepted",
  "definition": {
    "primarySubjectArea": { "min": 0.35, "max": 0.55 }
  },
  "provenance": {
    "derivedFrom": "video003",
    "sceneId": "scene_12",
    "blueprintLink": "BP-video003-scene-12",
    "reviewerAgent": "VisualReviewer",
    "ingestedTimestamp": "2026-06-26T13:00:00Z"
  }
}
```

---

## 6. Weighted Similarity Model

To cross-reference blueprints and retrieve similar layouts, the query engine calculates a **Weighted Similarity Score** ($S_{similarity}$).

### Mathematical Model
$$S_{similarity} = \sum (w_i \cdot S_i)$$

$$S_{similarity} = 0.30 \cdot S_{intent} + 0.20 \cdot S_{composition} + 0.15 \cdot S_{camera} + 0.10 \cdot S_{emotion} + 0.10 \cdot S_{tempo} + 0.10 \cdot S_{color} + 0.05 \cdot S_{motion}$$

Where:
- $S_{intent}$: Binary match score (`1.0` if intents match exactly, `0.0` otherwise).
- $S_{composition}$: Categorical matching of composition archetype.
- $S_{camera}$: Vector similarity of camera action/magnitude parameters.
- $S_{emotion}$: Categorical match of primary emotion tag.
- $S_{tempo}$: Normalized scalar delta of visual tempo.
- $S_{color}$: Euclidean distance of K-means color hex weights.
- $S_{motion}$: Categorical overlap of active animation ease rules.

*Any similarity output score $\ge 0.85$ triggers an automatic cross-link creation between blueprints in the index graph.*

---

## 7. Failed Patterns Registry (Mistake Archive)

The Failed Patterns Registry prevents the engine from generating layout designs that have previously failed reviews.

### `FP-XXX` Schema
```json
{
  "failedPatternId": "FP-002",
  "title": "Unmotivated Panning",
  "description": "Slow camera pan across static graphics with no horizontal timeline context.",
  "vetoTrigger": {
    "condition": "cameraAction == 'pan' && sceneArchetype != 'Timeline' && sceneArchetype != 'Comparison'"
  },
  "history": {
    "firstLoggedAt": "2026-06-25T15:20:00Z",
    "associatedReviewBlocker": "BLK-049",
    "provenanceSource": "video001"
  }
}
```

---

## 8. Query Engine Interface

The Storyboard Engine and review agents interact with the Knowledge Graph through a formal query contract.

### Sample Query Document
```json
{
  "query": {
    "action": "RETRIEVE_BLUEPRINT",
    "filter": {
      "aspectRatio": "9_16",
      "intent": "Teach",
      "targetEmotion": "Curiosity",
      "vcsLimit": 12
    },
    "similarityThreshold": 0.80,
    "limit": 3
  }
}
```

### Sample Response Document
```json
{
  "response": {
    "status": "Success",
    "matchesCount": 1,
    "results": [
      {
        "blueprintId": "BP-video002-scene-05",
        "similarityScore": 0.92,
        "location": "knowledge_base/blueprints/archetype_comparison/BP-video002-scene-05.json"
      }
    ]
  }
}
```

---

## 9. Evolution Loops & Feedback Mechanics

The Knowledge Graph evolves automatically through two feedback loops.

```
       Review Failure (Score < 4.0)                     Success Release (DONE State)
  +------------------------------------+           +------------------------------------+
  │ Reviewer appends failed attributes │           │ Compiler extracts scene parameters │
  │ to knowledge_base/failed_patterns/ │           │ and writes new active Blueprints   │
  +------------------------------------+           +------------------------------------+
```

### The Ingestion Evolution Loop
When a production video is successfully completed (reaches the `DONE` state), the compiler runs a post-release parser:
1. It extracts the final scene variables.
2. It generates a new Blueprint.
3. It appends the Blueprint to `knowledge_base/blueprints/`.
4. It increments the confidence metric of the matching rules by $C_{confidence} = C_{confidence} + 0.02$.

---

## 10. Knowledge Base Reviewer Specifications

The **Knowledge Base Reviewer** is responsible for validating graph database integrity.

### Reviewer Checks
- **Orphan Check**: Identify blueprints or rules lacking provenance links.
- **Cycle Detection**: Ensure similarity cross-references do not create infinite traversal loops.
- **Clash Verification**: Flag situations where an accepted rule in `knowledge_base/rules/` directly triggers a veto condition defined in the `failed_patterns/` registry.
- **Scale Check**: Flag rule metrics that exceed standard deviation limits (outliers).
