# Engine Alignment Fixes Applied

The following changes were made to move the project from a single-video prototype into a generalized educational video generation engine.

## 1. Reference Ingestion & Voice Generation Entrypoint

### [NEW] [run_engine.ts](file:///D:/my_stuff/zenn/code/src/run_engine.ts)
- Implemented a complete end-to-end ingestion pipeline.
- Extracts reference video metadata (resolution, frame rate, duration) via `ffprobe` and outputs `reference_analysis.json`.
- Parses text transcripts dynamically (stripping timestamp markings if present) to construct individual scenes.
- Executes `edge-tts` in a sub-process to generate narration for each scene.
- Automatically processes EdgeTTS audio into mono 16-bit 44.1kHz PCM WAV files using FFmpeg, then measures durations precisely via `ffprobe`.
- Generates a valid `storyboard.json` dynamically with scenes sized to the audio length, automatically resolving the fingerprint metadata.
- Copies ambient/music reference loops to the output directory and runs the compiler passes and raw canvas rendering pipeline.

---

## 2. Decoupling and Generalizing Compiler Core Passes

### [MODIFY] [camera_to_motion.ts](file:///D:/my_stuff/zenn/code/src/core/compiler/camera_to_motion.ts)
- Eliminated the hardcoded `phone_body` check.
- Resolves focus and emphasis targets dynamically by looking for the layout's primary subject (`zIndex === 10`).

### [MODIFY] [motion_to_render.ts](file:///D:/my_stuff/zenn/code/src/core/compiler/motion_to_render.ts)
- Decoupled rendering from the hardcoded `phone_body` animation tracks.
- Implemented a generic keyframe mapper that translates `input.motion` program items (`ENTER` and `EMPHASIZE` tokens) into absolute canvas coordinates, easing, opacity, and scale keyframe sequences.

### [MODIFY] [storyboard_to_audio.ts](file:///D:/my_stuff/zenn/code/src/core/compiler/storyboard_to_audio.ts)
- Replaced the hardcoded phone asset vibration SFX event with a generic emphasis SFX builder centered around the first scene's primary subject.

---

## 3. Dynamic Captioning & Reusable Draw Adapter

### [MODIFY] [motion_canvas.ts](file:///D:/my_stuff/zenn/code/src/core/adapter/motion_canvas.ts)
- Added `timelineIr` as an optional fifth parameter to the `render` signature to support dynamic caption queries.
- Updated the primary `isHumans` branch to resolve active captions dynamically from the timeline instead of hardcoded timestamp ranges (preserving backward compatibility if no timeline is passed).
- Rewrote the fallback rendering branch to be entirely generic:
  - **Subtitles**: Renders subtitle text dynamically for whichever caption/label assets are active in the timeline.
  - **Visuals**: Renders a beautiful, animated vector "Concept Node" (glowing blue primary orb, orbiting orange particles, connecting nodes, and text overlays indicating asset IDs) positioned at the compiled transform coordinates, with reactive shake effects for emphasis.
