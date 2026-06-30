import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type ReviewKind = 'review' | 'response';

interface ReviewEntry {
  readonly kind: ReviewKind;
  readonly version: number;
  readonly name: string;
  readonly path: string;
  readonly modifiedAtMs: number;
}

interface WatchState {
  readonly updatedAt: string;
  readonly reviewsDir: string;
  readonly latestReview?: string;
  readonly latestResponse?: string;
  readonly latestResponseMatchesReview: boolean;
  readonly status: 'NO_REVIEWS' | 'AWAITING_RESPONSE' | 'RESPONSE_PRESENT';
  readonly message: string;
}

const POLL_INTERVAL_MS = 3000;

function getReviewsDir(): string {
  return join(process.cwd(), '..', 'reviews');
}

function parseReviewName(name: string): ReviewEntry | null {
  const reviewMatch = /^review_v(\d+)$/.exec(name);
  if (reviewMatch) {
    return {
      kind: 'review',
      version: Number(reviewMatch[1]),
      name,
      path: join(getReviewsDir(), name),
      modifiedAtMs: 0,
    };
  }

  const responseMatch = /^review_v(\d+)_response$/.exec(name);
  if (responseMatch) {
    return {
      kind: 'response',
      version: Number(responseMatch[1]),
      name,
      path: join(getReviewsDir(), name),
      modifiedAtMs: 0,
    };
  }

  return null;
}

function listReviewEntries(reviewsDir: string): ReviewEntry[] {
  if (!existsSync(reviewsDir)) {
    return [];
  }

  const entries = readdirSync(reviewsDir, { withFileTypes: true });
  const reviewEntries: ReviewEntry[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const parsed = parseReviewName(entry.name);
    if (!parsed) {
      continue;
    }

    reviewEntries.push({
      ...parsed,
      modifiedAtMs: statSync(join(reviewsDir, entry.name)).mtimeMs,
    });
  }

  return reviewEntries;
}

function buildState(reviewsDir: string): WatchState {
  const entries = listReviewEntries(reviewsDir);
  const latestReview = entries
    .filter((entry) => entry.kind === 'review')
    .sort((a, b) => b.version - a.version)[0];
  const latestResponse = entries
    .filter((entry) => entry.kind === 'response')
    .sort((a, b) => b.version - a.version)[0];

  if (!latestReview) {
    const baseState: WatchState = {
      updatedAt: new Date().toISOString(),
      reviewsDir,
      latestResponseMatchesReview: false,
      status: 'NO_REVIEWS',
      message: 'No numbered review folders found yet.',
    };
    return latestResponse ? { ...baseState, latestResponse: latestResponse.name } : baseState;
  }

  const responseMatchesReview = Boolean(
    latestResponse && latestResponse.version === latestReview.version
  );

  const state: WatchState = {
    updatedAt: new Date().toISOString(),
    reviewsDir,
    latestResponseMatchesReview: responseMatchesReview,
    status: responseMatchesReview ? 'RESPONSE_PRESENT' : 'AWAITING_RESPONSE',
    message: responseMatchesReview
      ? `Latest review ${latestReview.name} has a response folder.`
      : `Latest review ${latestReview.name} is awaiting a matching response folder.`,
  };
  const withReview = { ...state, latestReview: latestReview.name };
  return latestResponse ? { ...withReview, latestResponse: latestResponse.name } : withReview;
}

function writeState(reviewsDir: string): WatchState {
  const state = buildState(reviewsDir);
  mkdirSync(reviewsDir, { recursive: true });
  const statePath = join(reviewsDir, 'watch_state.json');
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  return state;
}

function main() {
  const reviewsDir = getReviewsDir();
  let lastSerialized = '';

  const tick = () => {
    const state = writeState(reviewsDir);
    const serialized = JSON.stringify(state);
    if (serialized !== lastSerialized) {
      lastSerialized = serialized;
      console.log(`[watch:reviews] ${state.status}: ${state.message}`);
    }
  };

  tick();
  setInterval(tick, POLL_INTERVAL_MS);
}

main();
