export class DiagnosticsCollector {
    _entries = [];
    add(passId, severity, message) {
        this._entries.push({
            passId,
            severity,
            message,
            timestamp: new Date().toISOString(),
        });
    }
    get entries() {
        return this._entries;
    }
    get hasErrors() {
        return this._entries.some(e => e.severity === 'ERROR' || e.severity === 'FATAL');
    }
}
export class MetricsCollector {
    _metrics = {};
    set(key, value) {
        this._metrics[key] = value;
    }
    increment(key) {
        this._metrics[key] = (this._metrics[key] ?? 0) + 1;
    }
    get metrics() {
        return this._metrics;
    }
}
export function createDefaultContext(aspectRatio = '16_9') {
    return {
        config: { aspectRatio, strictMode: true },
        diagnostics: new DiagnosticsCollector(),
        metrics: new MetricsCollector(),
    };
}
