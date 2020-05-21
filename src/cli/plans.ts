import commander from 'commander';

import { ActionsInterface } from '../serviceManager';

export default (program: commander.Command, actions: ActionsInterface): commander.Command => {
  program
    .command('current')
    .description('get current plan details')
    .option('--project <project-id>', 'get plan for specific project')
    .action(actions.plans.get);

  return program;
};
