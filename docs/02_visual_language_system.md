# Zenn Educational Animation Engine (ZEAE)
## Visual Language System (VLS) v1.0

---

## 1. Purpose & Mathematical Base

The Zenn Educational Animation Engine (ZEAE) is built on a single, non-negotiable axiom: **Every visual element must serve an educational purpose.** 

The Visual Language System (VLS) is the mathematical and grammatical standard that governs how ideas are translated into visuals. By defining visual parameters through precise, quantitative metrics, the VLS eliminates subjective design opinions ("it looks bad") and replaces them with objective, reviewable rules (e.g., `VLS-COMP-001`).

This document serves as:
1. The **blueprint** for the Storyboard Engine to arrange layouts.
2. The **rulebook** for the Motion Canvas Renderer to execute camera paths and animations.
3. The **scoring catalog** for the Review Pipeline to evaluate every frame.

---

## 2. Typography Requirements

Typography is a structural communication channel, not a decorative layer. The font system must satisfy the following strict requirements:

| Requirement | Specification | Reason |
| :--- | :--- | :--- |
| **Stylistic Category** | Clean, geometric Sans-serif. | Prevents reading fatigue; ensures clean vector scaling. |
| **x-Height** | High x-height (ratio of lowercase letter height to uppercase >= 0.72). | Enhances readability at small scales and lower resolutions. |
| **Glyph Distinction** | High letterform differentiation (e.g., distinct shapes for `l`, `I`, `1`, and `O`, `0`). | Prevents cognitive load in scientific and technical terms. |
| **Weight Flexibility** | Variable font format supporting weights from `300` (Light) to `800` (Extra Bold). | Allows micro-adjustments to visual hierarchy without changing font size. |
| **Character Sets** | Complete Unicode support including Latin and Devanagari (Hindi) glyphs. | Supports localization and bilingual educational shorts. |
| **Aliasing Performance** | Clean rendering under sub-pixel anti-aliasing engines. | Keeps caption edges sharp at 60fps. |

*Note: Specific typefaces (e.g., Inter, Outfit, Noto Sans) are selected dynamically at compile time based on the active theme, provided they pass these validation criteria.*

---

## 3. Dual Grammar Layouts (16:9 vs. 9:16)

Educational long-form (16:9) and educational shorts (9:16) represent entirely different compositional systems. A simple crop of 16:9 into 9:16 is a failure.

```
16:9 Landscape Layout                    9:16 Portrait Layout
+-----------------------------------+    +-------------------+
|  [Subject]          [Supporting]  |    |     [Subject]     |
|                                   |    |                   |
|                                   |    |   [Supporting]    |
|  [================Captions=====]  |    |                   |
+-----------------------------------+    |  [===Captions===] |
                                         +-------------------+
```

### Format Grid & Grammar Matrix

| Metric / Rule | Landscape (16:9) | Portrait (9:16) | Architectural Reason |
| :--- | :--- | :--- | :--- |
| **Primary Subject Width** | 25% – 45% of frame width. | 45% – 70% of frame width. | Portrait format requires larger subjects to compensate for reduced horizontal span. |
| **Caption Safe Area** | Bottom 10% of frame height. | Bottom 15% of frame height. | Mobile interfaces overlay UI elements on the bottom; safe zone must be deeper. |
| **Camera Travel Distance** | Longer horizontal sweeps (up to 50% of frame width). | Shorter vertical pans (maximum 20% of frame height). | Portrait format limits panning range; prevents motion sickness. |
| **Objects Per Scene Limit** | 5 to 7 objects. | 3 to 5 objects. | Reduces visual clutter in tight portrait boundaries. |
| **Negative Space Ratio** | 40% – 60% of total area. | 50% – 70% of total area. | Keeps portrait focus centered; avoids cramping the composition. |
| **Panning Vectors** | Primary: Horizontal (X-Axis). | Primary: Vertical (Y-Axis). | Matches natural eye movement along the dominant aspect ratio axis. |

---

## 4. Visual Rule Registry

Rules are categorized by subsystem using prefix-scoped IDs.

### Composition Rules (`VLS-COMP-XXX`)
* **`VLS-COMP-001` (Primary Subject Area)**: Occupies 35% – 55% of landscape frame area | 50% – 70% of portrait frame area. *Measured by Visual Reviewer.*
* **`VLS-COMP-002` (Secondary Subject Area)**: Occupies 15% – 25% of landscape frame area | 10% – 20% of portrait frame area. *Measured by Visual Reviewer.*
* **`VLS-COMP-003` (Background Space)**: Occupies 30% – 45% of landscape frame area | 20% – 35% of portrait frame area. *Measured by Visual Reviewer.*
* **`VLS-COMP-004` (Max Object Count)**: Maximum 7 elements in landscape | Maximum 5 elements in portrait. *Measured by Storyboard Reviewer.*
* **`VLS-COMP-005` (Attention Hook Time)**: Settle focus on primary target within <= 300 ms in landscape | <= 250 ms in portrait. *Measured by Video QA.*
* **`VLS-COMP-006` (Text-Background Contrast)**: Minimum WCAG AAA ratio of 7.0:1. *Measured by Visual Reviewer.*
* **`VLS-COMP-007` (Safe Zone Padding)**: Outer 5% border in landscape | Outer 10% border in portrait. *Measured by Storyboard Reviewer.*
* **`VLS-COMP-008` (Visual Complexity)**: Visual Complexity Score (VCS) <= 15 in landscape | VCS <= 10 in portrait. *Measured by Storyboard Reviewer.*

### Camera Rules (`VLS-CAM-XXX`)
* **`VLS-CAM-001` (Camera Zoom Speed)**: Zoom velocity of 0.05x – 0.2x per second in landscape | 0.08x – 0.25x per second in portrait. *Measured by Video QA.*
* **`VLS-CAM-002` (Panning Travel Limit)**: Horizontal pans capped at 30% of landscape frame width | Vertical pans capped at 15% of portrait frame height. *Measured by Video QA.*

### Motion Rules (`VLS-MOTION-XXX`)
* **`VLS-MOTION-001` (Motion Easing)**: Standard ease-in-out Cubic Bezier `(0.42, 0, 0.58, 1)` | Portrait speed curve `(0.25, 0.1, 0.25, 1)`. *Measured by Video QA.*
* **`VLS-MOTION-002` (Simultaneous Motion Count)**: Maximum 3 moving objects in landscape | Maximum 2 moving objects in portrait. *Measured by Video QA.*

### Caption Rules (`VLS-CAP-XXX`)
* **`VLS-CAP-001` (Caption Line Limit)**: Maximum 2 text lines in both formats. *Measured by Video QA.*
* **`VLS-CAP-002` (Words Per Line)**: Maximum 10 words per line in landscape | Maximum 6 words per line in portrait. *Measured by Video QA.*
* **`VLS-CAP-003` (Caption Text Size)**: Font height 3.5% – 4.5% of landscape height | 4.0% – 5.0% of portrait height. *Measured by Visual Reviewer.*

### Color Rules (`VLS-COLOR-XXX`)
* **`VLS-COLOR-001` (Accent Color Ratio)**: 5% – 10% of total image pixels. *Measured by Visual Reviewer.*
* **`VLS-COLOR-002` (Primary Color Ratio)**: 20% – 30% of landscape pixels | 15% – 25% of portrait pixels. *Measured by Visual Reviewer.*
* **`VLS-COLOR-003` (Neutral Color Ratio)**: 60% – 70% of landscape pixels | 65% – 80% of portrait pixels. *Measured by Visual Reviewer.*

---

## 5. Temporal Language

Visual progression in a scene must flow through seven distinct sequential phases to give the viewer time to parse and digest information.

```
[Scene Open] ➔ [Focus Lock] ➔ [Reveal] ➔ [Explanation] ➔ [Confirmation] ➔ [Transition] ➔ [Exit]
  (0-300ms)      (300-800ms)    (0.8-1.5s)    (1.5-4.5s)     (4.5-5.5s)      (5.5-6.5s)    (6.5-7.0s)
```

1. **Scene Open (0 – 300ms)**: Visual frames establish baseline environment. Narration begins. Background color set.
2. **Focus Lock (300 – 800ms)**: The primary subject enters or transitions to high visibility. The viewer registers where to look.
3. **Reveal (800 – 1500ms)**: Key context labels, indicators, or zoom changes show the core relationship.
4. **Explanation (1500 – 4500ms)**: Narration explains the concept. Secondary animations (such as flow indicators or state swaps) match spoken points.
5. **Confirmation (4500 – 5500ms)**: All motion pauses. Static frame allows the viewer to read captions and commit the layout to memory.
6. **Transition (5500 – 6500ms)**: Primary focus fades or camera moves toward the next segment's origin.
7. **Exit (6500 – 7000ms)**: Frame clears completely or dissolves.

---

## 6. Scene Success Metrics

Every scene is graded quantitatively during the Video QA pipeline. Timings are calculated as offsets relative to the scene start ($T_0$).

| Metric ID | Target Parameter | Landscape (16:9) Target | Portrait (9:16) Target | Measured By |
| :--- | :--- | :--- | :--- | :--- |
| **VLS-MET-001** | Primary subject fully visible | $\le 500\text{ ms}$ | $\le 350\text{ ms}$ | Video QA Reviewer |
| **VLS-MET-002** | Educational concept hook drawn | $800 - 1500\text{ ms}$ | $600 - 1200\text{ ms}$ | Video QA Reviewer |
| **VLS-MET-003** | First auxiliary motion begins | $1500 - 2000\text{ ms}$ | $1200 - 1800\text{ ms}$ | Video QA Reviewer |
| **VLS-MET-004** | Initial caption block completed | $\le 2000\text{ ms}$ | $\le 1500\text{ ms}$ | Video QA Reviewer |
| **VLS-MET-005** | Final post-narration freeze duration | $\ge 1000\text{ ms}$ | $\ge 800\text{ ms}$ | Video QA Reviewer |
| **VLS-MET-006** | Scene transition duration | $500 - 1000\text{ ms}$ | $400 - 800\text{ ms}$ | Video QA Reviewer |

---

## 7. Narration Synchronization Rules

Visual movement and voiceover (narration) must be tightly integrated to maximize comprehension.

* **`VLS-SYNC-001` (Offset Limit)**: New visual assets must appear within $\pm 150\text{ ms}$ of the corresponding spoken keyword.
* **`VLS-SYNC-002` (Sequential Easing)**: Supporting callouts or connector animations must trigger only after the narrator finishes introducing the primary noun (minimum $400\text{ ms}$ delay post-word).
* **`VLS-SYNC-003` (Message Splitting)**: Introduce only **one** new visual noun per spoken clause. If a sentence contains two concepts, split them into separate visual phases or distinct scenes.
* **`VLS-SYNC-004` (Caption Lock)**: Text captions must render word-for-word with a maximum audio latency of $100\text{ ms}$.

---

## 8. Visual Weight vs. Narrative Weight

Visual balance requires distinguishing between physical scale/contrast and educational importance.

```
       Visual Weight (Scale/Contrast)
                 ▲
                 │   [Large Mountain]
                 │   (Visually Heavy,
                 │    Narratively Light)
                 │
                 │                 [Active Molecule]
                 │                 (Visually Light,
                 │                  Narratively Heavy)
                 └──────────────────────────────────► Narrative Weight (Importance)
```

* **Visual Weight**: Calculated by shape complexity, size, color saturation, and fill density. Governs screen balance and prevents visual tilt.
* **Narrative Weight**: Calculated by educational importance. Governs callout frequency, animation highlight, and layout grouping.
* **Grammar Rule**: If an object has *low* visual weight but *high* narrative weight (e.g., a tiny key molecule in a cell), the layout engine MUST apply visual amplification indicators (e.g., high-contrast accent color halo, magnifying callout box, or high-weight arrow indicator) to equalize visual and narrative focus.

---

## 9. Reference Extraction Mapping

This matrix details how VLS parameters are extracted from reference videos.

| VLS Domain | Automated Extraction? | Manual Review Required? | Extraction Technique / Logic |
| :--- | :--- | :--- | :--- |
| **Object Count** | Yes | No | Object detection / bounding box calculation per cut frame. |
| **Camera Speed** | Yes | No | Optical flow pixel tracking over scene timeline. |
| **Color Ratio** | Yes | No | K-means pixel clustering and color palette extraction. |
| **Caption Timing** | Yes | No | Audio transcription alignment (whisper/forced-alignment). |
| **Educational Intent** | Partial | Yes | NLP keyword mapping of transcript; manual owner verify. |
| **Emotional Choreography** | Partial | Yes | Sentiment analysis on audio/text; manual verify of scale/tempo. |
| **Visual Tempo** | Yes | No | Scene change detection frequency and average optical speed. |

---

## 10. Scene & Educational Intent Taxonomy

Every scene is classified into a single Category and mapped to a primary Educational Intent.

### Scene Categories
1. **INTRO**: Hook-oriented. Highly visual, low text density. High motion budget.
2. **QUESTION**: Setup. Creates cognitive tension. Prominent visual puzzles or text callouts.
3. **DISCOVERY**: Unveiling. High contrast shift. Quick camera action (snap zoom or focus pull).
4. **EXPLANATION**: Deep dive. Ratios are balanced. High background/neutral space. Lower animation count.
5. **COMPARISON**: Side-by-side. Vertical/horizontal bisect lines. Balanced asset weights.
6. **TIMELINE**: Progression. Flowing horizontal or vertical vectors. Objects reveal sequentially.
7. **PROCESS**: Cause/effect. Visual loops or loops of sequential node highlights.
8. **WARNING**: Threat/caution. Dominant warning colors (red/orange). Negative space constricts.
9. **REVEAL**: Climax. Radial scale expansions, camera pullback. Accent ratio peaks.
10. **CONCLUSION**: Summary. Clean background, minimalist assets, slow exit transitions.

### Educational Intent & Camera Mapping

| Educational Intent | Primary Camera Behavior | Intent-to-Camera Logic |
| :--- | :--- | :--- |
| **Teach** | Static or Slow Zoom In (0.05x/sec). | Focuses attention on a detail; stabilizes mental processing. |
| **Compare** | Pan (X-axis in 16:9, Y-axis in 9:16). | Shifts eyes cleanly from A to B to establish relationship. |
| **Warn** | Static (High contrast) or Snap In. | Sudden visual scale changes create alert signals in brain. |
| **Reveal** | Zoom Out (Dolly Back). | Pulls back to show context; connects details to the big picture. |
| **Demonstrate** | Target Follow (Tracking). | Keeps moving parts in focus; maintains reference vector. |
| **Summarize** | Slow Zoom Out (0.02x/sec). | Creates a feeling of closure and macro-level understanding. |
| **Question** | Slow Tilt / Pitch. | Slight off-axis shift creates subtle curiosity and tension. |
| **Provoke Curiosity** | Shallow depth-of-field transition. | Blurs background to emphasize a mysterious foreground object. |

---

## 11. Attention Flow Model

Attention flow is the sequence in which the viewer's eyes traverse a frame. The storyboard engine must arrange components to guide the eye along a strict, path-based timeline.

```
+-------------------------------------------------------+
|  [1. Hook / Accent] --(300ms)--> [2. Primary Subject] |
|                                           |           |
|                                         (500ms)       |
|                                           v           |
|  [4. Caption] <-------(800ms)------ [3. Supporting]   |
+-------------------------------------------------------+
```

### Execution Steps
1. **Step 1: Hook (0 - 300ms)**: High-contrast, vibrant accent element or sudden entrance motion grabs immediate attention.
2. **Step 2: Primary Subject (300 - 800ms)**: Visual weight guides the eye to the core educational asset.
3. **Step 3: Supporting Element (800 - 1200ms)**: Text labels, connector arrows, or secondary assets provide context.
4. **Step 4: Caption Reading (1200 - 2000ms)**: Eyes sweep down to read the subtitle text.
5. **Step 5: Scene Cut / Transition**: Cut occurs only after eye traversal is complete, preventing cognitive fragmentation.

---

## 12. Visual Complexity Score (VCS)

The Visual Complexity Score (VCS) is a mathematical model used by the Storyboard Reviewer to measure cognitive load.

### The Formula
$$VCS = (N \times W_{object}) + (M \times W_{motion}) + (C_{unique} \times 1.5)$$

Where:
- $N$: Number of visible static assets.
- $W_{object}$: Average visual weight of the assets (Heavy = 3, Medium = 2, Light = 1).
- $M$: Number of active simultaneous animations.
- $W_{motion}$: Animation speed/complexity modifier (High speed = 3, Standard ease = 2, Subtle creep = 1).
- $C_{unique}$: Number of unique color hues present in the scene.

### Complexity Limits
- **16:9 Format**: Maximum VCS = `15` (Ideal range: `8` to `12`).
- **9:16 Format**: Maximum VCS = `10` (Ideal range: `5` to `8`).
- *If a scene's VCS exceeds these limits, the Storyboard Reviewer must reject the scene under rule VLS-COMP-008.*

---

## 13. Visual Tempo & Pacing

Visual Tempo defines the speed of visual change. It must align with the narration's speed and density.

```
Visual Tempo = Narration Speed (words/sec) * Scene Cut Density (cuts/min)
```

### Pacing Guidelines

| Tempo | Cut Interval | Camera Speed | Animation Speed | Narration Speed | Typical Scene Use |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Fast** | 1.5s – 3.0s | Snap / Rapid Zoom | Snap entrance (<200ms) | 150 – 170 wpm | INTRO, REVEAL, WARNING |
| **Medium** | 3.0s – 6.0s | Slow creep (0.05x/sec) | Ease transition (500ms) | 130 – 150 wpm | EXPLANATION, COMPARISON |
| **Slow** | 6.0s – 12.0s | Static | Slow reveal (>1000ms) | 110 – 130 wpm | CONCLUSION, PROCESS |

---

## 14. Reusable Scene Archetypes

The Storyboard Engine constructs scenes using these eleven standard templates.

---

### Archetype 1: Question
- **Composition**: Central focal node with a question mark graphic. High contrast background.
- **Motion**: Subtle float on the focal node; background elements creep outward slowly.
- **Narrative Use**: Scene entry point setting up the educational challenge.

---

### Archetype 2: Comparison
- **Composition**: Split frame (vertical split for 16:9, horizontal for 9:16). Subject A left/top, Subject B right/bottom.
- **Motion**: Alternating highlight animations when narration discusses A vs. B.
- **Narrative Use**: Pointing out key differences, performance gaps, or visual contrasts.

---

### Archetype 3: Timeline
- **Composition**: Line vector sweeping left-to-right (16:9) or top-to-bottom (9:16) with marked timestamp nodes.
- **Motion**: Camera tracks the progression, revealing node graphics as they cross the focal point.
- **Narrative Use**: Historical progressions, execution loops, or evolution over time.

---

### Archetype 4: Cross Section
- **Composition**: Outer shell split open to reveal internal components. Labels pointing inside.
- **Motion**: Exploded view animation separating outer shell from the core.
- **Narrative Use**: Explaining internal machinery, cell structures, or layered concepts.

---

### Archetype 5: Callout
- **Composition**: Isolated subject with magnifying glass highlight ring and a text label.
- **Motion**: Snap focus zoom on the target area; label draws in via scale-up.
- **Narrative Use**: Spotlighting small details in a complex diagram.

---

### Archetype 6: Zoom Reveal
- **Composition**: Starts inside a macro-texture, zooms out to reveal the full object.
- **Motion**: High-velocity zoom out (dolly out) with ease-out curve.
- **Narrative Use**: Shift from microscopic view to everyday object.

---

### Archetype 7: Cause Effect
- **Composition**: Connector arrow between Action Node (left) and Reaction Node (right).
- **Motion**: Pulsing wave travels along the arrow, triggering change animation on the Reaction Node.
- **Narrative Use**: Explaining physics, software triggers, or feedback loops.

---

### Archetype 8: Memory
- **Composition**: Central subject framed by dark vignettes or warm sepia tones.
- **Motion**: Extremely slow zoom-in with film grain overlay or light leaks.
- **Narrative Use**: Recalling historical contexts or ancient human behaviors.

---

### Archetype 9: Danger
- **Composition**: Warning colors (Red/Orange). Subject placed low, surrounded by negative space.
- **Motion**: Static tension with sudden, rapid scale jumps or visual shifts.
- **Narrative Use**: Highlight mistakes, risks, or predator encounters.

---

### Archetype 10: Process
- **Composition**: Circular arrow ring containing 3-5 process nodes.
- **Motion**: Highlight cursor moves sequentially around the ring.
- **Narrative Use**: Repeating loops, cycles, or state machines.

---

### Archetype 11: Transformation
- **Composition**: Subject morphing or shifting state directly in the center.
- **Motion**: Shape morphing, fade transitions, or color sweep.
- **Narrative Use**: Showing change of state, melting, or conversion.

---

## 15. Asset Visual Weight Guidelines

Visual Weight measures how strongly an asset draws attention. The layout engine uses this to calculate compositions and balance frames.

### Weight Scale Parameters

```
Visual Weight = Area Complexity + Fill Density + Saturation Factor
```

```
Scale: [Light (1)] ➔➔➔ [Medium (2)] ➔➔➔ [Heavy (3)]
```

* **Light (Weight 1)**: Outline icons, dotted lines, label text, semi-transparent grids.
* **Medium (Weight 2)**: Flat vector illustrations with up to 3 colors, solid lines, shaded panels.
* **Heavy (Weight 3)**: High-contrast detailed graphics, filled shapes using accent colors, moving characters, text in warning panels.

---

## 16. Motion Budget Constraints

To prevent chaotic animations, developers and renderers must comply with these budgets.

- **Simultaneous Motions**: Maximum `3` elements can move at the same time. If a fourth element enters, it must wait for others to settle.
- **Camera Travel Limit**: Only `1` camera movement path can run per scene. No simultaneous pan and rotation.
- **Attention Target Constraints**: Maximum `2` active focal rings or accent highlights can display at any moment.

---

## 17. Reviewer Mapping Matrix

To ensure clear ownership, rules are assigned to specific review agents.

```
[Visual Language System]
       |
       +---> Storyboard Reviewer: VLS-COMP-003, VLS-COMP-004, VLS-COLOR-003, VLS-COMP-007, VLS-COMP-008
       |
       +---> Visual Reviewer:     VLS-COMP-001, VLS-COMP-002, VLS-CAP-003, VLS-COMP-006, VLS-COLOR-001, VLS-COLOR-002
       |
       +---> Video QA Reviewer:   VLS-COMP-005, VLS-CAP-001, VLS-CAP-002, VLS-CAM-001, VLS-MOTION-001, VLS-MOTION-002, VLS-CAM-002
```

---

## 18. Failed Patterns Registry

This registry tracks invalid designs to prevent repeating mistakes.

---

### FAILED_PATTERN_001: Floating Abstract Icons
- **Description**: Inserting floating icons (e.g., gears, bulb symbols, sparks) to fill empty space.
- **Reason for Failure**: Violates Constitution Rule 3 & 4. Visuals lack intent and fragment viewer attention.
- **Correction**: Use clean negative space. Empty space is not an error; it provides eye rest.

---

### FAILED_PATTERN_002: Unmotivated Panning
- **Description**: Slow panning across a static scene containing no directional timeline or comparison layouts.
- **Reason for Failure**: Violates Constitution Rule 6. Camera moves without narrative purpose; induces motion sickness.
- **Correction**: Keep camera static. Move only when following a subject or transition.

---

### FAILED_PATTERN_003: Subtitle Overlay on Focus Area
- **Description**: Subtitles overlapping the lower boundary of a primary subject.
- **Reason for Failure**: Violates Constitution Rule 10. Clutters text; compromises reading readability.
- **Correction**: Reposition primary subject upward or constrict subject size to maintain safe zone padding.

---

### FAILED_PATTERN_004: Decorative Screen Shake
- **Description**: Adding screen-shake effects to normal transitions or audio beats.
- **Reason for Failure**: Violates Constitution Rule 2 & 4. Distracts from visual communication; adds zero educational value.
- **Correction**: Use clean, ease-in-out cuts or dissolve transitions.
