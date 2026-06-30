# Implementation Plan: Reusable Video Generation Engine

This plan transitions the prototype codebase from a hardcoded single-video demo into a generalized, reusable video generation engine.

## Proposed Changes

### 1. Ingestion Entrypoint & EdgeTTS Integration

#### [NEW] [run_engine.ts](file:///D:/my_stuff/zenn/code/src/run_engine.ts)
We will create a new pipeline engine script that:
- Accepts CLI arguments: `referenceVideoPath`, `transcriptPath`, and `outputWorkspace`.
- **Reference Analysis**: Uses `ffprobe` to extract resolution, frame rate, and duration of the reference video and saves it to `reference_analysis.json` in the output workspace.
- **Narration Generation**: Parses the transcript line-by-line and invokes the `edge-tts` python CLI dynamically to generate `.wav` narration files for each sentence.
- **Audio Duration Extraction**: Uses `ffprobe` to measure the precise duration of each generated `.wav` file.
- **Dynamic Storyboard Generation**: Builds a `storyboard.json` where scene durations match the actual narration length. It dynamically structures assets (e.g. `subject_{idx}` and `caption_{idx}`).
- **Orchestration**: Runs all compiler passes (`PipelineRunner.run`) and renders the final video output via `MotionCanvasAdapter.render`.

### 2. Generalizing Compiler Passes

#### [MODIFY] [camera_to_motion.ts](file:///D:/my_stuff/zenn/code/src/core/compiler/camera_to_motion.ts)
- Replace the hardcoded `phone_body` check with a generic query for the layout's primary subject (`zIndex === 10`).

#### [MODIFY] [motion_to_render.ts](file:///D:/my_stuff/zenn/code/src/core/compiler/motion_to_render.ts)
- Replace the hardcoded `phone_body` animation block with a generic keyframe generator that reads the motion program items from `input.motion` (translating `ENTER` and `EMPHASIZE` tokens dynamically).

#### [MODIFY] [storyboard_to_audio.ts](file:///D:/my_stuff/zenn/code/src/core/compiler/storyboard_to_audio.ts)
- Replace the hardcoded `phone_body` SFX vibration trigger with a check for the scene's primary subject.

### 3. Generalizing the Rendering Adapter

#### [MODIFY] [motion_canvas.ts](file:///D:/my_stuff/zenn/code/src/core/adapter/motion_canvas.ts)
- Update `render` method signature to accept `timelineIr` so it can resolve active caption text dynamically at frame `f`.
- Rewrite the fallback branch to draw:
  - **Caption Labels**: Draws a subtitle box and renders active caption text dynamically.
  - **Visual Assets**: Draws a beautiful, procedural, glowing "Concept Node" with rotating orbits and label overlay for the asset ID.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify compilation.
- Execute `node dist/run_engine.js <ref_video> <transcript> <out_workspace>` on a test workspace to generate a video.
