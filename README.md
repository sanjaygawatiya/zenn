# Zenn Educational Animation Engine (ZEAE)

This project compiles JSON storyboards into structured rendering intermediate representations (IRs) and uses a custom vector canvas adapter to render final high-quality videos using FFmpeg.

---

## Prerequisites

To compile and run the project locally, make sure you have the following installed:
1. **Node.js** (v18 or higher) & **npm**
2. **Python** (v3.8 or higher, required for visual similarity checks and keyframe analysis)
3. **Git**

---

## Setup Instructions

1. **Navigate to the code directory**:
   ```bash
   cd zenn/code
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Compile the TypeScript codebase**:
   ```bash
   npm run build
   ```

---

## Running the Reusable Ingestion Engine

The engine accepts a reference video and a script transcript as inputs, automatically extracts pacing and visual theme colors, generates EdgeTTS narration, renders custom dynamic scenes, and validates output similarity against a hard quality gate (default 50.0%).

1. **Execute the ingestion engine script**:
   ```bash
   node dist/run_engine.js <reference_video_path> <transcript_text_path> [output_workspace_directory]
   ```
   *Example*:
   ```bash
   node dist/run_engine.js 'D:/my_stuff/zenn/reference/templates/What Did Ancient Humans Do at Night _1080p.mp4' 'src/fixtures/dummy_transcript.txt' './workspace_test'
   ```

2. **Customize Quality Gates**:
   Set `SIMILARITY_THRESHOLD` environment variable to adjust the required average similarity (e.g. `20.0` to `90.0` percent):
   ```bash
   # On Windows Powershell
   $env:SIMILARITY_THRESHOLD="60.0"
   node dist/run_engine.js ...
   ```

---

## Project Structure

- `code/src/`: Core TypeScript source files.
  - `code/src/core/compiler/`: Parsers, compiler pipeline, and IR structures.
  - `code/src/core/adapter/`: Rendering canvas and adapters interfacing with FFmpeg.
  - `code/src/core/utils/`: Python helper scripts for scene segmentation (`analyze_reference.py`) and visual similarity checks (`similarity_validator.py`).
  - `code/src/run_engine.ts`: Orchestration entrypoint.
- `docs/`: Technical specifications and analyses.
- `reference/`: Reference assets, transcripts, and template videos.
