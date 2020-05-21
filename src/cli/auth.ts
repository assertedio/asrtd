import commander from 'commander';

import { ActionsInterface } from '../serviceManager';

export default (program: commander.Command, actions: ActionsInterface): commander.Command => {
  program.command('login').option('--no-open').option('--token-stdin').action(actions.auth.login);

  program.command('logout').description('remove current authentication token if present').action(actions.auth.logout);

  return program;
};
