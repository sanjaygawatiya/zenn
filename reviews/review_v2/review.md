# ZEAE Goal Alignment Review v2

## Scope
This review checks whether the current implementation matches the target engine behavior:
- accept a reference video and transcript
- generate narration with a consistent branded voice
- produce reusable, generalized scene generation
- render original visuals that follow the learned structure of the reference
- avoid hardcoded single-video behavior

## Verdict
The project has moved materially closer to the intended engine shape, and the decision to keep one fixed branded voice is acceptable.

## Aligned Changes
1. A reusable engine entrypoint now exists.
2. The pipeline accepts external reference and transcript inputs instead of only a fixed storyboard fixture.
3. Dynamic narration generation is present through EdgeTTS.
4. The fallback renderer now uses generic dynamic caption resolution and generic concept-node visuals.
5. Several clip-specific branches were generalized away from one demo asset.

## Remaining Gaps
1. Reference analysis still appears shallow.
- The engine reads video metadata, but it still needs stronger reference understanding such as scene segmentation, frame/keyframe extraction, and visual pattern analysis.

2. Frame similarity is still not measurable.
- The stated goal includes generating frames that look similar to the reference by a measurable threshold.
- There is no visible similarity scoring step yet, so that requirement is not yet verifiable.

3. The current transcript-to-scene mapping is still too direct.
- Parsing transcript lines into scenes is useful, but it is not the same as a full reference-guided visual blueprint system.
- The engine should still derive pacing and scene structure from the reference video, not only the transcript text.

4. End-to-end verification still needs to be cleanly green.
- Type checking passes.
- The existing end-to-end render test still times out, so the final validation story is not fully stable yet.

## Notes on Voice Strategy
Keeping one voice is fine if the goal is to build brand identity and consistency.
That is no longer a review concern.
What matters is that the voice is used intentionally and consistently across generated outputs.

## What Antigravity Should Do Next
1. Add deeper reference analysis from the source video.
2. Add frame/keyframe extraction and scene segmentation.
3. Add a measurable visual similarity evaluation step.
4. Keep the branded voice fixed, but document it as an intentional product choice.
5. Fix or extend the end-to-end test so the full pipeline is verified without timeout.
6. Keep removing any remaining demo-only assumptions as they surface.

## Evidence
- `code/src/run_engine.ts`
- `code/src/core/adapter/motion_canvas.ts`
- `code/src/core/compiler/storyboard_to_audio.ts`
- `code/src/core/compiler/camera_to_motion.ts`
- `code/src/core/compiler/motion_to_render.ts`
- `code/src/tests/runner.test.ts`

## Summary
This is now a legitimate engine direction rather than a single-video prototype, but it still needs deeper reference understanding and measurable similarity validation before it fully satisfies the original goal.
