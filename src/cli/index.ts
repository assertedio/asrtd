import chalk from 'chalk';
import commander from 'commander';
import figlet from 'figlet';
import terminalLink from 'terminal-link';

import { ConfigInterface } from '../config';
import { ActionsInterface, ServicesInterface } from '../serviceManager';
import auth from './auth';
import plans from './plans';
import projects from './projects';
import records from './records';
import routines from './routines';
import stats from './stats';

export default async (
  program: commander.Command,
  actions: ActionsInterface,
  services: ServicesInterface,
  config: ConfigInterface
): Promise<commander.Command> => {
  const logo = chalk.bold.greenBright(figlet.textSync('asserted.io'));

  const { version, appHost } = config;

  let status;

  if (!services.globalConfig.getApiKey()) {
    status = chalk.red('No token. Run `asrtd login`');
  } else {
    status = (await services.api.auth.verifyKey(services.globalConfig.getApiKey()))
      ? chalk.green('Authenticated')
      : chalk.red('Invalid token. Run `asrtd login`');
  }

  program
    .storeOptionsAsProperties(false)
    .name('asrtd')
    .usage('[global options] <command>')
    .version(version)
    .description(
      `${logo}
        
      Test in prod.
      
      ${chalk.blue(terminalLink(`Dashboard: ${appHost}`, appHost))}
      
      Version: ${version}
      
      Authentication Status: ${status}`
    );

  auth(program, actions);
  records(program, actions);
  routines(program, actions);
  stats(program, actions);

  const plansProgram = new commander.Command('plans');
  plansProgram.description(`plans related commands ${chalk.grey("('asrtd plans --help' for more details)")}`);
  program.addCommand(plans(plansProgram, actions));

  const projectsProgram = new commander.Command('projects');
  projectsProgram.description(`projects related commands ${chalk.grey("('asrtd projects --help' for more details)")}`);
  program.addCommand(projects(projectsProgram, actions));

  return program;
};
