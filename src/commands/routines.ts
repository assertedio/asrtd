import {
  CreateRoutine,
  CreateRoutineInterface,
  DEPENDENCIES_VERSIONS,
  OVERALL_ROUTINE_STATUS,
  Routine,
  ROUTINE_CONFIG_STATUS,
  RoutineConfigInterface,
  RoutineInterface,
  UpdateRoutine,
} from '@asserted/models';
import { Dependencies } from '@asserted/runner';
import { capitalCase } from 'capital-case';
import chalk from 'chalk';
import fs from 'fs-extra';
import { uniq } from 'lodash';
import ora from 'ora';
import path from 'path';
import { table } from 'table';
import terminalLink from 'terminal-link';

import { logSummary } from '@asserted/pack';
import { Interactions } from '../interactions';
import { OVERWRITE_ROUTINE } from '../interactions/init';
import { InitParametersInterface } from '../lib/models/init';
import { Api } from '../lib/services/api';
import { FeedbackInterface } from '../lib/services/feedback';
import { GlobalConfig } from '../lib/services/globalConfig';
import { LocalRunner } from '../lib/services/localRunner';
import { RoutineConfigs } from '../lib/services/routineConfigs';
import { RoutinePacker } from '../lib/services/routinePacker';
import { getColorOfStatus } from '../lib/services/utils';
import getLogger from '../logger';
import { TABLE_CONFIG } from './utils';

export interface ServicesInterface {
  interactions: Interactions;
  api: Api;
  routineConfigs: RoutineConfigs;
  globalConfig: GlobalConfig;
  localRunner: LocalRunner;
  routinePacker: RoutinePacker;
  exec: any;
  feedback: FeedbackInterface;
}

export interface ConfigInterface {
  assertedDir: string;
  appHost: string;
}

const TEMPLATES_PATH = path.join(__dirname, './templates');

const debug = getLogger('commands:routines');

/**
 * @class
 */
export class Routines {
  private readonly services: ServicesInterface;

  private readonly config: ConfigInterface;

  /**
   * @param {ServicesInterface} services
   * @param {ConfigInterface} config
   */
  constructor(services: ServicesInterface, config: ConfigInterface) {
    this.services = services;
    this.config = config;
  }

  /**
   * Install packages in asserted dir
   *
   * @returns {Promise<void>}
   */
  async installPackages(): Promise<void> {
    const spinner = ora('Installing packages in .asserted...').start();

    const cmd = 'npm install';
    const { stderr, error }: { stdout; stderr; error } = await new Promise((resolve) => {
      this.services.exec(cmd, { cwd: this.config.assertedDir }, (_error, _stdout, _stderr) => {
        resolve({ error: _error, stdout: _stdout, stderr: _stderr });
      });
    });

    if (error) {
      spinner.fail('Error during packages install');
      this.services.feedback.error(stderr);
      throw new Error('Error during packages install');
    }

    spinner.succeed('Packages installed');
  }

  /**
   * Create routine
   *
   * @param {CreateRoutineInterface} partialConfig
   * @returns {Promise<Routine>}
   */
  async createRoutine(partialConfig: CreateRoutineInterface): Promise<RoutineInterface> {
    const createRoutine = new CreateRoutine(partialConfig);
    const routine = await this.services.api.routines.create(createRoutine);

    await fs.ensureDir(this.config.assertedDir);
    await this.services.routineConfigs.write(routine.toRoutineConfig());
    return routine;
  }

  /**
   * Get input from user on if routine should be merged or overwritten
   *
   * @param {boolean} merge
   * @returns {Promise<InitRoutineInterface>}
   */
  async resolveConflict(): Promise<void> {
    switch (await this.services.interactions.init.confirmOverwrite()) {
      case OVERWRITE_ROUTINE.ABORT: {
        throw new Error('Aborted');
      }
      case OVERWRITE_ROUTINE.OVERWRITE: {
        await fs.remove(this.config.assertedDir).catch(() => ({}));
        break;
      }
      default: {
        throw new Error('Unexpected option');
      }
    }
  }

  /**
   * Write pjson
   *
   * @returns {Promise<void>}
   */
  async writePjson(): Promise<void> {
    const { dependencies } = Dependencies.getLatest();

    const pjson = {
      scripts: {
        prepare: 'npx mkdirp node_modules',
      },
      dependencies,
    };

    await fs.writeJson(path.join(this.config.assertedDir, 'package.json'), pjson, { spaces: 2 });
  }

  /**
   * Get Config from command line args and user interaction
   *
   * @param {InitParametersInterface} params
   * @returns {Promise<CreateRoutineInterface>}
   */
  async getConfigFromArgs(params: InitParametersInterface): Promise<CreateRoutineInterface> {
    let { projectId, name, description, intervalValue, intervalUnit } = params;

    projectId = projectId || (await this.services.interactions.projects.selectProject()).id;

    ({ name, description, intervalValue, intervalUnit } = await this.services.interactions.init.getInitParameters({
      name,
      description,
      intervalValue,
      intervalUnit,
    }));

    return {
      projectId,
      name,
      description,
      interval: {
        value: intervalValue,
        unit: intervalUnit,
      },
    };
  }

  /**
   * Initialize routineConfig
   *
   * @param {InitParametersInterface} params
   * @returns {Promise<void>}
   */
  async initialize(params: InitParametersInterface): Promise<void> {
    const { examples, install } = params;

    await this.services.interactions.auth.ensureAuth();

    if (await this.services.routineConfigs.exists()) {
      await this.resolveConflict();
    }

    const partialConfig = await this.getConfigFromArgs(params);
    debug('Creating new routine...');
    const { id } = await this.createRoutine(partialConfig);
    this.services.feedback.success('Created routine and wrote config to .asserted/routine.json');

    await this.writePjson();

    if (examples) {
      debug(`Copying all template files to: ${this.config.assertedDir}`);
      await fs.copy(TEMPLATES_PATH, this.config.assertedDir);
      // This is really dumb, but for some reason, NPM auto-renames .gitignore to .npmignore. So this is a workaround
      await fs.move(path.join(this.config.assertedDir, 'gitignore'), path.join(this.config.assertedDir, '.gitignore'));
    } else {
      this.services.feedback.warn('Skipping copy of example tests');
      await fs.copy(path.join(TEMPLATES_PATH, 'gitignore'), path.join(this.config.assertedDir, '.gitignore'));
    }

    if (install) {
      await this.installPackages();
    } else {
      this.services.feedback.warn("Skipping asserted dependency install. Run 'npm install' in the .asserted directory if needed.");
    }

    this.services.feedback.success('Initialization complete');
    this.services.feedback.info(
      `Use '${chalk.green('asrtd run')}' to run the tests locally, then '${chalk.green('asrtd push')}' to run them continuously online.`
    );
    const routineSettings = new URL(`routines/${id}/settings`, this.config.appHost).toString();
    this.services.feedback.info(
      `Go to routine settings to configure notifications: ${chalk.blue(terminalLink(`${routineSettings}`, routineSettings))}`
    );
  }

  /**
   * Get routine status
   *
   * @param {Routine} routine
   * @returns {OVERALL_ROUTINE_STATUS}
   */
  static getRoutineStatus(routine: Routine): OVERALL_ROUTINE_STATUS {
    if (!routine.enabled) {
      return ROUTINE_CONFIG_STATUS.DISABLED;
    }
    if (!routine.hasPackage) {
      return ROUTINE_CONFIG_STATUS.NOT_PUSHED;
    }
    return ROUTINE_CONFIG_STATUS.ACTIVE;
  }

  /**
   * Get routine table data
   *
   * @param {Routine[]} routines
   * @param {boolean} includeProjectId
   * @returns {[]}
   */
  static getRoutineTableData(routines: Routine[], includeProjectId: boolean): any[] {
    const headers = [chalk.blue.bold('Routine ID'), chalk.blue.bold('Routine Name'), chalk.blue.bold('Status')];

    if (includeProjectId) {
      headers.unshift(chalk.blue.bold('Project ID'));
    }

    return [
      headers,
      ...routines.reduce((result, routine) => {
        const status = Routines.getRoutineStatus(routine);
        const routineRow = [routine.id, routine.name, chalk[getColorOfStatus(status)](capitalCase(status))];

        if (includeProjectId) {
          routineRow.unshift(routine.projectId);
        }

        result.push(routineRow);
        return result;
      }, [] as any[]),
    ];
  }

  /**
   * List routines
   *
   * @param {string?} projectId
   * @returns {Promise<void>}
   */
  async list(projectId?: string): Promise<void> {
    projectId = projectId || (await this.services.interactions.projects.selectProject()).id;

    const routines = await this.services.api.routines.list(projectId);

    const projectIdCount = uniq(routines.map(({ projectId: _projectId }) => _projectId)).length;
    this.services.feedback.noIdent(table(Routines.getRoutineTableData(routines, projectIdCount > 1), TABLE_CONFIG));
  }

  /**
   * Remove routine
   *
   * @param {string} routineId
   * @param {boolean} force
   * @returns {Promise<void>}
   */
  async remove(routineId?: string, force = false): Promise<void> {
    routineId = routineId || (await this.services.interactions.routines.selectRoutine()).id;

    if (!force && !(await this.services.interactions.routines.confirmDelete(routineId))) {
      throw new Error('delete not confirmed');
    }

    await this.services.api.routines.remove(routineId);
    this.services.feedback.success(`Routine ${routineId} removed`);
  }

  /**
   * Start routine
   *
   * @param {string} routineId
   * @returns {Promise<void>}
   */
  async enable(routineId?: string): Promise<void> {
    routineId = routineId || (await this.services.interactions.routines.selectRoutine()).id;

    await this.services.api.routines.enable(routineId);
    this.services.feedback.success(`Routine ${routineId} enabled`);
  }

  /**
   * Stop routine
   *
   * @param {string} routineId
   * @returns {Promise<void>}
   */
  async disable(routineId?: string): Promise<void> {
    routineId = routineId || (await this.services.interactions.routines.selectRoutine()).id;

    await this.services.api.routines.disable(routineId);
    this.services.feedback.success(`Routine ${routineId} disabled`);
  }

  /**
   * Push new version of routine
   *
   * @returns {Promise<void>}
   */
  async push(): Promise<void> {
    const routine: RoutineConfigInterface = await this.services.routineConfigs.readOrThrow();
    const { package: packageString, summary, shrinkwrapJson, packageJson } = await this.services.routinePacker.pack();

    logSummary(summary);

    const updateRoutine = new UpdateRoutine({
      ...routine,
      package: packageString,
      dependencies: routine.dependencies === DEPENDENCIES_VERSIONS.CUSTOM ? { shrinkwrapJson, packageJson } : routine.dependencies,
    });

    await this.services.api.routines.push(routine.id, updateRoutine);
    this.services.feedback.success(`Routine ${routine.id} updated`);
  }
}
