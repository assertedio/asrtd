import { cleanString, INTERVAL_UNITS, Routine } from '@asserted/models';
import chalk from 'chalk';
import commander from 'commander';

import { ActionsInterface } from '../serviceManager';

const INTERVAL_UNIT_VALUES = Object.values(INTERVAL_UNITS);

export default (program: commander.Command, actions: ActionsInterface): commander.Command => {
  program
    .command('init')
    .description(`initialize routine in current dir ${chalk.grey('(omit options for interactive mode)')}`)
    .option('-n, --name <name>', 'name of routine', (input) => {
      input = cleanString(input);
      if (input.length > Routine.CONSTANTS.NAME_MAX_LENGTH) {
        throw new Error(`if provided, name has a max length of: ${Routine.CONSTANTS.NAME_MAX_LENGTH}`);
      }

      return input;
    })
    .option('-d, --description <description>', 'description of routine', (input) => {
      input = cleanString(input);
      if (input.length > Routine.CONSTANTS.DESCRIPTION_MAX_LENGTH) {
        throw new Error(`if provided, description has a max length of: ${Routine.CONSTANTS.DESCRIPTION_MAX_LENGTH}`);
      }

      return input;
    })
    .option('--project <project-id>', 'id of the project that the routine will be created in', (input) => {
      input = cleanString(input);
      return input;
    })
    .option(`--interval-unit <${INTERVAL_UNIT_VALUES.join('|')}>`, 'interval unit', (input) => {
      if (!INTERVAL_UNIT_VALUES.includes(input as any)) {
        throw new Error(`if provided, interval unit must be one of: ${INTERVAL_UNIT_VALUES.join(', ')}`);
      }
      return input;
    })
    .option('--interval-value <number>', 'interval value', (input) => {
      const inputNumber = Number.parseInt(input, 10);

      if (!input || !inputNumber || inputNumber < 1) {
        throw new Error('if provided, interval value must be an integer greater than 0');
      }

      return inputNumber;
    })
    .option('--merge', 'if .asserted exists, only create new routine id')
    .option('--no-examples', "don't create examples during initialization")
    .option('--no-install', "don't install asserted dependencies")
    .action(actions.routines.init);

  program
    .command('list')
    .alias('ls')
    .description(`list routines ${chalk.grey('(defaults to project of routine in current dir, prompts otherwise)')}`)
    .option('--project <project-id>', 'list routines for specific project')
    .action(actions.routines.list);

  program
    .command('remove [routine-id]')
    .alias('rm')
    .description(`delete routine ${chalk.grey('(defaults to current routine, omit options for interactive confirm)')}`)
    .option('-f, --force', "just do it, don't confirm", false)
    .action(actions.routines.remove);

  program
    .command('enable [routine-id]')
    .description(`start running routine ${chalk.grey('(defaults to current routine, no-op if already running)')}`)
    .action(actions.routines.enable);

  program
    .command('disable [routine-id]')
    .description(`stop running routine ${chalk.grey('(defaults to current routine, no-op if already stopped)')}`)
    .action(actions.routines.disable);

  program
    .command('run')
    .description(`run routine once - defaults to local run ${chalk.grey('(options override routine config)')}`)
    .option('--files [glob or list]', 'files to include in test run')
    .option('-i, --ignore [glob or list]', 'files to ignore during test run')
    .option('--no-bail', "don't stop on the first failure", false)
    .option('--online', `run routine online ${chalk.grey('(does not overwrite currently pushed routine)')}`)
    .option('--pushed [routineId]', `immediately run pushed routine ${chalk.grey('(does not trigger notifications and is not recorded)')}`)
    .action(actions.routines.run);

  program.command('push').description('push routine online and begin running on interval').action(actions.routines.push);

  return program;
};
