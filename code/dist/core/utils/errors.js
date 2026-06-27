export class CompilerError extends Error {
    code;
    severity;
    section;
    pass;
    constructor(message, code, severity, section, pass) {
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
    constructor(message, code, section, pass) {
        super(message, code, 'ERROR', section, pass);
    }
}
export class ValidationError extends CompilerError {
    constructor(message, code, section, pass) {
        super(message, code, 'ERROR', section, pass);
    }
}
export class CompilationError extends CompilerError {
    constructor(message, code, section, pass) {
        super(message, code, 'ERROR', section, pass);
    }
}
export class AdapterError extends CompilerError {
    constructor(message, code, section, pass) {
        super(message, code, 'ERROR', section, pass);
    }
}
