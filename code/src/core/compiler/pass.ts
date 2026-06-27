import { Result } from '../utils/result.js';
import { CompilerContext } from './context.js';
import { CompilerError } from '../utils/errors.js';

export interface CompilerPass<TInput, TOutput> {
  readonly id: string;
  readonly version: string;
  compile(
    input: Readonly<TInput>,
    context: CompilerContext
  ): Result<Readonly<TOutput>, CompilerError[]>;
}
