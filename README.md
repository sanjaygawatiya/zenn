# Zenn Educational Animation Engine (ZEAE)

This project compiles JSON storyboards into structured rendering intermediate representations (IRs) and uses a custom vector canvas adapter to render final high-quality videos using FFmpeg.

---

## Prerequisites

To compile and render the project locally, make sure you have the following installed:
1. **Node.js** (v18 or higher) & **npm**
2. **Python** (v3.8 or higher, required for the automatic Python-based `static-ffmpeg` package used by the canvas adapter)
3. **Git**

---

## Setup Instructions

1. **Clone the repository and navigate to the code directory**:
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

## Running the Rendering Pipeline

To compile the storyboard and render the visual animation into the final video (`output_humans.mp4`):

1. **Execute the pipeline runner script**:
   ```bash
   node dist/run_humans_pipeline.js
   ```

2. The output video will be generated directly at:
   `zenn/code/output_humans.mp4`

---

## Project Structure

- `code/src/`: Core TypeScript source files.
  - `code/src/core/compiler/`: Parsers, compiler pipeline, and IR structures.
  - `code/src/core/adapter/`: Rendering canvas and adapters interfacing with FFmpeg.
  - `code/src/fixtures/storyboard/`: Storyboard input data (e.g. `ancient_humans.json`).
  - `code/src/run_humans_pipeline.ts`: Pipeline entrypoint script.
- `docs/`: Technical specifications and analyses.
- `reference/`: Reference assets, transcripts, and template videos.
