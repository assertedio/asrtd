import commander from 'commander';

import { ActionsInterface } from '../serviceManager';

export default (program: commander.Command, actions: ActionsInterface): commander.Command => {
  program
    .command('login')
    .description('authenticate cli and store token locally')
    .option('--no-open', 'do not auto-open the browser')
    .option('--no-hidden', 'show the token as its entered. Less secure, but necessary on some OS')
    .option('--token-stdin', 'take token from stdin instead of using the interactive prompt')
    .action(actions.auth.login);

  program.command('logout').description('remove current authentication token if present').action(actions.auth.logout);

  return program;
};
