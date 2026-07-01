# Review Handoff

This folder is the review exchange area for the Zenn engine work.

## Convention
- `review_v1/` contains the current reviewer findings and requirements.
- Antigravity should create a sibling folder for its response, fixes, and implementation plan.
- Each follow-up response should stay versioned, for example `review_v2/`, `review_v3/`, and so on.
- `master_review.md` is the canonical consolidated review for the current goal.
- Use the master review when you want one complete pass instead of multiple mini-iterations.

## Current Intent
- Keep the project aligned with the actual engine goal.
- Prevent drift back into single-video or single-fixture behavior.
- Use this folder as the handoff point between review and implementation.
- Prefer updating `master_review.md` for the final consolidated review state.

## Temporary Watcher
- The repo includes a temporary watcher script at `code/src/watch_reviews.ts`.
- Run it with `npm run watch:reviews` from the `code/` directory.
- It writes the current state to `reviews/watch_state.json` and keeps the latest review/response relationship visible without manual paste steps.
