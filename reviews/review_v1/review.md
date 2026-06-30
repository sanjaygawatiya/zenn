# ZEAE Goal Alignment Review v1

## Purpose
This review records whether the current codebase matches the stated target:
- input a reference video and transcript
- generate narration with EdgeTTS or equivalent TTS
- generate original frames that resemble the reference at the concept level
- run as a reusable engine, not a one-off clip pipeline

## Verdict
Current implementation is a prototype pipeline with strong modular pieces, but it is not yet the full engine described above.

## Blocking Gaps
1. The execution path starts from storyboard fixtures instead of reference-video + transcript input.
2. The audio pipeline does not yet generate narration from transcript using EdgeTTS.
3. Multiple passes still contain clip-specific special cases, which keeps the system tied to one demo.
4. The docs still mix two goals: reusable engine vs single static storyboard demo.

## What Antigravity Must Do Next
1. Add a reference ingestion entrypoint that accepts:
   - reference video path
   - transcript path
   - output workspace
2. Add transcript-driven narration generation with EdgeTTS.
3. Remove hardcoded sample-specific logic such as:
   - `phone_body`
   - `SCN-0001`
   - fixed subtitle text
4. Make the pipeline preserve multi-scene inputs through every stage.
5. Update docs so they clearly describe the engine goal, not a single-clip prototype.
6. Add tests that prove the pipeline works for more than one reference video.

## Evidence
- `code/src/run_humans_pipeline.ts`
- `code/src/core/compiler/runner.ts`
- `code/src/core/compiler/storyboard_to_audio.ts`
- `code/src/core/compiler/storyboard_to_layout.ts`
- `code/src/core/compiler/timeline_to_camera.ts`
- `code/src/core/compiler/camera_to_motion.ts`
- `code/src/core/compiler/motion_to_render.ts`
- `code/src/core/adapter/motion_canvas.ts`
- `docs/13_motion_canvas_adapter_specification.md`

## Expected Antigravity Response
Antigravity should create a sibling folder inside `reviews/` containing:
- the fixes it applied
- the implementation plan it created
- any updated evidence or notes

Prefer a versioned folder name such as `review_v1_response/` or `fixes_v1/`.
