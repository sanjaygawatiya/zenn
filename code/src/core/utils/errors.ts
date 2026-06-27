export class CompilerError extends Error {
  readonly code: string;
  readonly severity: 'INFO' | 'WARNING' | 'ERROR' | 'FATAL';
  readonly section: string;
  readonly pass: string;

  constructor(
    message: string,
    code: string,
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'FATAL',
    section: string,
    pass: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.severity = severity;
    this.section = section;
    this.pass = pass;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SchemaError extends CompilerError {
  constructor(message: string, code: string, section: string, pass: string) {
    super(message, code, 'ERROR', section, pass);
  }
}

export class ValidationError extends CompilerError {
  constructor(message: string, code: string, section: string, pass: string) {
    super(message, code, 'ERROR', section, pass);
  }
}

export class CompilationError extends CompilerError {
  constructor(message: string, code: string, section: string, pass: string) {
    super(message, code, 'ERROR', section, pass);
  }
}

export class AdapterError extends CompilerError {
  constructor(message: string, code: string, section: string, pass: string) {
    super(message, code, 'ERROR', section, pass);
  }
}
