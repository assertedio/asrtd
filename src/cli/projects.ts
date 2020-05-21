import commander from 'commander';

import { ActionsInterface } from '../serviceManager';

export default (program: commander.Command, actions: ActionsInterface): commander.Command => {
  program.command('list').description('list all projects for this user').action(actions.projects.list);

  return program;
};
