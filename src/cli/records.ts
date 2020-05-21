import chalk from 'chalk';
import commander from 'commander';

import { ActionsInterface } from '../serviceManager';
import { parseDate } from '../utils';

export default (program: commander.Command, actions: ActionsInterface): commander.Command => {
  program
    .command('records [routine-id]')
    .description(`records for routine ${chalk.grey('(defaults to current routine)')}`)
    .option('-s, --start <iso date>', 'start timestamp in ISO-8601', parseDate)
    .option('-e, --end <iso date>', 'end timestamp in ISO-8601', parseDate)
    .option('-n, --nextAfter <iso date>', 'go to next page by passing in last date of current page', parseDate)
    .option('-p, --prevBefore <iso date>', 'go to previous page by passing in first date of current page', parseDate)
    .option('-l, --limit <1-100>', 'limit per page (default 20)', (input) => {
      const inputNumber = Number.parseInt(input, 10);

      if (!input || inputNumber < 1) {
        throw new Error('if provided, interval value must be an integer greater than 0');
      }

      return inputNumber;
    })
    // .option('--show-passes', 'show all passes', false)
    .action(actions.records.list);

  program
    .command('record <record-id>')
    .description(`get record details ${chalk.grey('(defaults to current routine)')}`)
    .option('-r, --routine-id <routine id>', `record in routine ${chalk.grey('(defaults to current routine)')}`)
    .option('--exclude-hooks', 'do not show hook details', false)
    .action(actions.records.get);

  return program;
};
