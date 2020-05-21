import chalk from 'chalk';
import commander from 'commander';

import { ActionsInterface } from '../serviceManager';
import { parseDate } from '../utils';

export default (program: commander.Command, actions: ActionsInterface): commander.Command => {
  program
    .command('status [routine-id]')
    .description(`status of routine ${chalk.grey('(defaults to routine in current dir, prompts otherwise)')}`)
    .option('--project <project-id>', 'project id to list routine status')
    .option('--all', 'show status of all routines in project', false)
    .action(actions.stats.status);

  program
    .command('timeline [routine-id]')
    .description(`timeline of uptime for routine ${chalk.grey('(defaults to current routine)')}`)
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
    .action(actions.stats.timeline);

  return program;
};
