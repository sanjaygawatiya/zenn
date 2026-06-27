# Zenn Educational Animation Engine (ZEAE) - Project Constitution

This file defines the core rules and constraints that govern all AI agent behaviors, planning, development, and code reviews in this workspace.

## The Ten Absolute Rules
1. **Never optimize before correctness.**
2. **Never sacrifice readability for cleverness.**
3. **Never generate visuals without visual intent.**
4. **Never animate without purpose.**
5. **Never place assets without composition.**
6. **Never move the camera without narrative motivation.**
7. **Never approve work without measurable review.**
8. **Never bypass quality gates.**
9. **Never allow architecture drift.**
10. **Every frame must communicate.**

---

## Core Philosophy
- **Think in ideas, not assets:** We select illustrations only after determining the abstract idea (e.g., Isolation, Curiosity, Memory).
- **Function over Decoration:**
  - Illustrations exist to communicate ideas.
  - Animation exists to direct attention.
  - Camera exists to control focus.
  - Sound exists to reinforce emotion.
  - Captions exist to improve comprehension.
- **Deterministic Rendering:** The rendering engine must remain entirely deterministic. Artificial Intelligence is used for storyboarding, scripts, topic creation, and blueprints, but the renderer must never ask AI how to draw or render a frame. Same input must yield the same output.
