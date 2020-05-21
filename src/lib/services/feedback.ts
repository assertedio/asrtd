/* eslint-disable no-console */
import chalk, { ForegroundColor } from 'chalk';
import logSymbols from 'log-symbols';

export interface FeedbackInterface {
  noIdent: (input: string, textColor?: typeof ForegroundColor) => void;
  note: (input: string, textColor?: typeof ForegroundColor) => void;
  info: (input: string, textColor?: typeof ForegroundColor) => void;
  success: (input: string, textColor?: typeof ForegroundColor) => void;
  warn: (input: string, textColor?: typeof ForegroundColor) => void;
  error: (input: string, textColor?: typeof ForegroundColor) => void;
}

const feedback: FeedbackInterface = {
  noIdent: (input: string, textColor?: typeof ForegroundColor): void => console.log(textColor ? chalk[textColor](input) : input),
  info: (input: string, textColor?: typeof ForegroundColor): void => console.log(logSymbols.info, textColor ? chalk[textColor](input) : input),
  note: (input: string, textColor?: typeof ForegroundColor): void => console.log(' ', textColor ? chalk[textColor](input) : input),
  success: (input: string, textColor?: typeof ForegroundColor): void => console.log(logSymbols.success, textColor ? chalk[textColor](input) : input),
  warn: (input: string, textColor?: typeof ForegroundColor): void => console.log(logSymbols.warning, textColor ? chalk[textColor](input) : input),
  error: (input: string, textColor?: typeof ForegroundColor): void => console.log(logSymbols.error, textColor ? chalk[textColor](input) : input),
};

export default feedback;
/* eslint-enable no-console */
