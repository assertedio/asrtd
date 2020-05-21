import chalk from 'chalk';

export const instruct = (instruction: string) => console.log(`\n${chalk.green('--MANUAL-TESTING -> ')}${instruction}\n`);
