# Zenn Educational Animation Engine (ZEAE)
## Audio Pipeline Specification (Audio IR System) v1.0

```text
Document ID: ZEAE-DOC-12
Document Name: Audio Pipeline Specification
Version: 1.0 Draft
Phase: Phase 11
Previous Document: 11_render_engine_architecture.md
Next Document: 13_motion_canvas_adapter_specification.md
```

---

## 1. Purpose & Decoupling Boundaries

The **Audio Pipeline** acts as the temporal audio compiler for the Zenn Educational Animation Engine (ZEAE). Its sole responsibility is to translate semantic audio intents (from the **Storyboard IR** and **Timeline IR**) and raw waveforms into a unified, mathematically resolved **Audio IR**.

### The "Zero Creative Authority" Principle
To prevent architectural drift and maintain complete mixing determinism, the Audio Pipeline operates under a strict, non-negotiable directive: **The Audio Pipeline has zero creative authority. It does not generate speech, compose music, or invent sound effects. It compiles, synchronizes, mixes, and normalizes pre-existing audio assets into a deterministic Audio IR that is executed identically across rendering engines.**

Upstream pipelines (TTS engines, sound designers) are responsible for asset creation. The Audio Pipeline is responsible for:
- Mapping sound assets onto the timeline.
- Resolving volume gain envelopes (ducking and cross-fading).
- Enforcing loudness normalization standards.

---

## 2. Audio Grammar & Silence Asset Model

To ensure audio directly supports visual storytelling, sound behaviors are governed by a formal **Audio Grammar**. 

### Audio Grammar Tokens

| Grammar Token | Intended Semantic Behavior | Educational Purpose |
| :--- | :--- | :--- |
| **`NARRATE`** | Primary voiceover narration active. | Direct transfer of conceptual knowledge. |
| **`PAUSE`** | Short spoken gap (200ms – 800ms) between clauses. | Gives viewer time to parse the previous phrase. |
| **`SILENCE`** | Extended period of zero narration and zero music. | Creates high cognitive tension and anticipation before a reveal. |
| **`EMPHASIZE`** | Spike in narration pitch/volume or sound trigger. | Highlights a critical keyword or visual state change. |
| **`WHISPER`** | Lower volume voiceover with high high-frequency range. | Denotes interior thoughts, warnings, or secrets. |
| **`IMPACT`** | Sudden, high-volume SFX trigger (e.g. clang, pop). | Confirms a visual collision, reveal, or state change. |
| **`TRANSITION`** | Sweeping sound effect (e.g. whoosh, sweep). | Guides the eyes through a camera pan or scene cut. |

### Silence as a First-Class Asset
Silence is never an accidental gap. It is treated as an active visual-audio asset:
```json
{
  "eventId": "AUD-SIL-004",
  "type": "Silence",
  "startMs": 4200,
  "durationMs": 800,
  "motivation": "Create anticipation before SCN-002 zoom-reveal"
}
```
*If silent intervals exceed 800ms without an explicit `Silence` motivation, the compiler flags a warning.*

---

## 3. Four-Track Audio Model

The Audio IR coordinates four parallel sound channels:

1. **Narration Track**: The primary vocal track containing the spoken narration waves.
2. **Sound Effects (SFX) Track**: Highlight triggers (whooshes, pops, clicks) aligned with keyframe timestamps and visual reveals. Every SFX event must specify a `motivation` (Reveal, Impact, Transition, Confirmation, Attention, Atmosphere).
3. **Ambient Track**: Seamless looping background environment noise (e.g., low cave rumble, office hum) to prevent dead-air feel.
4. **Music Track**: Soundtrack music containing ducking properties.

---

## 4. Ducking & Loudness Normalization Rules

To maintain high vocal intelligibility, the mixer applies automated gain envelopes and loudness limits during compilation.

### Gain Ducking Envelopes
- **Ducking Trigger**: Whenever a `NARRATE` event is active on the Narration Track, the compiler automatically attenuates the Music Track by $-12\text{ dB}$ and the Ambient Track by $-6\text{ dB}$.
- **Transition Ramps**: Volume transitions use linear ramps over a $200\text{ ms}$ envelope window (fade-down starts $100\text{ ms}$ before speech; fade-up completes $100\text{ ms}$ after speech ends).

```
Music Track Volume (dB)
  0 dB  ──────────┐                                     ┌──────────
                  │ \                                 / │
                  │   \                             /   │
 -12 dB           │     └─────────────────────────┘     │
                  │     |                         |     │
Narration Track   └─────┼─── Spoken Narration ────┼─────┘
                     -100ms                     +100ms
```

### Loudness Normalization Standards
All compiled master tracks must meet these final mix thresholds:
- **Master Target Loudness**: $-14.0\text{ LUFS}$ integrated over the full duration.
- **Maximum True Peak**: $-1.0\text{ dBTP}$ to prevent digital clipping across devices.
- **Dynamic Range Target**: Minimum $6.0\text{ LRA}$ (Loudness Range) to maintain dynamic impact.

---

## 5. Audio Compiler Passes

The Audio Pipeline processes the input tracks through six sequential compilation passes.

```
[Timeline IR]
    │
    ├── Pass 1: Voice Indexing (Register VO file paths and alignments)
    │
    ├── Pass 2: SFX Resolution (Align SFX to visual transition timestamps)
    │
    ├── Pass 3: Synchronization (Coordinate audio/visual group events)
    │
    ├── Pass 4: Gain Resolution (Calculate ducking and cross-fade curves)
    │
    ├── Pass 5: Normalization (Compute and scale LUFS and Peak gains)
    │
    └── Pass 6: Audio IR Generation (Generate compiled Audio IR file) ──➔ [Audio IR]
```

---

## 6. Audio IR Schema

The **Audio IR** is the final compiled static output of the Audio Pipeline.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AudioIR",
  "type": "object",
  "properties": {
    "audioId": { "type": "string" },
    "storyboardId": { "type": "string" },
    "totalDurationMs": { "type": "integer" },
    "masterLoudnessLufs": { "type": "number" },
    "fingerprint": {
      "type": "object",
      "properties": {
        "averageLufs": { "type": "number" },
        "pauseDensity": { "type": "number" },
        "sfxRatio": { "type": "number" },
        "narrationRatio": { "type": "number" },
        "ambientRatio": { "type": "number" },
        "musicRatio": { "type": "number" }
      },
      "required": ["averageLufs", "pauseDensity", "sfxRatio", "narrationRatio", "ambientRatio", "musicRatio"]
    },
    "tracks": {
      "type": "object",
      "properties": {
        "narration": { "$ref": "#/definitions/AudioTrack" },
        "sfx": { "$ref": "#/definitions/AudioTrack" },
        "ambient": { "$ref": "#/definitions/AudioTrack" },
        "music": { "$ref": "#/definitions/AudioTrack" }
      },
      "required": ["narration", "sfx", "ambient", "music"]
    }
  },
  "required": ["audioId", "storyboardId", "totalDurationMs", "masterLoudnessLufs", "fingerprint", "tracks"],
  "definitions": {
    "AudioTrack": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "eventId": { "type": "string" },
          "resolvedFileUri": { "type": "string" },
          "startMs": { "type": "integer" },
          "durationMs": { "type": "integer" },
          "loop": { "type": "boolean" },
          "motivation": { "type": "string", "enum": ["explain", "compare", "reveal", "emphasize", "transition", "maintain_presence"] },
          "gainEnvelope": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "offsetMs": { "type": "integer" },
                "volumeDb": { "type": "number" }
              },
              "required": ["offsetMs", "volumeDb"]
            }
          }
        },
        "required": ["eventId", "resolvedFileUri", "startMs", "durationMs", "loop", "motivation", "gainEnvelope"]
      }
    }
  }
}
```

---

## 7. Audio Validation Rules (Quality Gate QG-11)

The Audio Reviewer evaluates the Compiled Audio IR against these checks:

* **`AUD-001` (Clipping Peak Overrun)**: Resolved master channel true peak exceeds $-1.0\text{ dBTP}$ threshold.
* **`AUD-002` (Narration Collision)**: Two primary narration voiceover audio files overlap in time, creating unintelligible dual speech.
* **`AUD-003` (Loudness Out-of-Bounds)**: Integrated loudness of the compiled mix is outside the $-14.0\text{ LUFS} \pm 1.0\text{ LUFS}$ target range.
* **`AUD-004` (Unresolved SFX Target)**: SFX trigger offset drifts $> \pm 150\text{ ms}$ from its target visual keyframe timeline node.
* **`AUD-005` (Missing Ducking Envelope)**: Music track fails to declare ducking attenuation curves during a narration speech envelope.
* **`AUD-006` (Unused Audio Asset)**: An audio asset exists in the workspace folder but is not declared in any track lists.
* **`AUD-007` (Extended Unmotivated Silence)**: Audio output detects silent gaps exceeding $1200\text{ ms}$ that lack a declared `Silence` grammar object.
