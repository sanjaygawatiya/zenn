export interface CompilerConfig {
  readonly aspectRatio: '16_9' | '9_16';
  readonly strictMode: boolean;
}

export type DiagnosticSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'FATAL';

export interface DiagnosticEntry {
  readonly passId: string;
  readonly severity: DiagnosticSeverity;
  readonly message: string;
  readonly timestamp: string;
}

export class DiagnosticsCollector {
  private _entries: DiagnosticEntry[] = [];

  add(passId: string, severity: DiagnosticSeverity, message: string): void {
    this._entries.push({
      passId,
      severity,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  get entries(): readonly DiagnosticEntry[] {
    return this._entries;
  }

  get hasErrors(): boolean {
    return this._entries.some(e => e.severity === 'ERROR' || e.severity === 'FATAL');
  }
}

export class MetricsCollector {
  private _metrics: Record<string, number> = {};

  set(key: string, value: number): void {
    this._metrics[key] = value;
  }

  increment(key: string): void {
    this._metrics[key] = (this._metrics[key] ?? 0) + 1;
  }

  get metrics(): Readonly<Record<string, number>> {
    return this._metrics;
  }
}

export interface CompilerContext {
  readonly config: CompilerConfig;
  readonly diagnostics: DiagnosticsCollector;
  readonly metrics: MetricsCollector;
}
export function createDefaultContext(aspectRatio: '16_9' | '9_16' = '16_9'): CompilerContext {
  return {
    config: { aspectRatio, strictMode: true },
    diagnostics: new DiagnosticsCollector(),
    metrics: new MetricsCollector(),
  };
}
