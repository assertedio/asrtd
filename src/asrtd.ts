#!/usr/bin/env node
import chalk from 'chalk';
import commander from 'commander';

import cli from './cli';
import { load } from './configLoader';
import feedback from './lib/services/feedback';
import logger from './logger';
import { ServiceManager } from './serviceManager';

const log = logger('asrtd');

const listener = (error: Error): void => {
  log(`Stack: ${error.stack}`);
  feedback.error(`${chalk.red('Error:')} ${error?.message}`);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
};
process.on('unhandledRejection' as any, listener);

(async (): Promise<void> => {
  try {
    const config = load();
    const { actions, services } = new ServiceManager(config);

    let program = new commander.Command();
    program = cli(program, actions, services, config);

    program.parse(process.argv);

    if (!program.args) {
      program.help();
    }
  } catch (error) {
    feedback.error(chalk.red(error.message));
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
})();
