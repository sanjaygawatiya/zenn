import { createHash } from 'node:crypto';
import { canonicalStringify } from './canonical.js';

export function computeFingerprint(data: unknown): string {
  const canonical = canonicalStringify(data);
  return createHash('sha256').update(canonical).digest('hex');
}
