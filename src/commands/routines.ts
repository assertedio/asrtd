import {
  CreateRoutine,
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
import { ROUTINE_FILENAME } from '../lib/constants';
import { InitParametersInterface, InitRoutineInterface } from '../lib/models/init';
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

  /* eslint-disable max-params */
  /**
   * Create routine
   *
   * @param merge
   * @param {string} projectId
   * @param {string} name
   * @param {string} description
   * @param {string} intervalUnit
   * @param {number} intervalValue
   * @returns {Promise<Routine>}
   */
  async createRoutine(
    merge: boolean,
    projectId: string,
    name: string,
    description?: string,
    intervalUnit?: string,
    intervalValue?: number
  ): Promise<RoutineInterface> {
    const existingRoutine = merge ? (await this.services.routineConfigs.read(true)) || undefined : undefined;

    // TODO: Name, description, and interval are loaded elsewhere
    // This is dumb, and should be co-located
    const createRoutine = new CreateRoutine({
      projectId,
      name,
      description,
      interval: { unit: intervalUnit as any, value: intervalValue },
      mocha: existingRoutine?.mocha || undefined,
      dependencies: existingRoutine?.dependencies || undefined,
      timeoutSec: existingRoutine?.timeoutSec || undefined,
    });
    const routine = await this.services.api.routines.create(createRoutine);

    await fs.ensureDir(this.config.assertedDir);
    await this.services.routineConfigs.write(routine.toRoutineConfig());
    return routine;
  }
  /* eslint-enable max-params */

  /**
   * Load routine
   *
   * @param {InitRoutineInterface} params
   * @returns {Promise<InitRoutineInterface>}
   */
  async loadRoutine(params: InitParametersInterface): Promise<InitRoutineInterface> {
    let result = OVERWRITE_ROUTINE.ABORT;

    if (params.merge) {
      result = OVERWRITE_ROUTINE.MERGE;
    } else {
      result = await this.services.interactions.init.confirmOverwrite();
    }

    if (result === OVERWRITE_ROUTINE.ABORT) {
      throw new Error('Aborted');
    }

    if (result === OVERWRITE_ROUTINE.OVERWRITE) {
      if (await fs.pathExists(this.config.assertedDir)) {
        await fs.remove(this.config.assertedDir);
      }

      return { ...params };
    }

    this.services.feedback.note(`Attempting to load ${ROUTINE_FILENAME}`);

    const {
      name,
      description,
      interval: { unit: intervalUnit, value: intervalValue },
    } = await this.services.routineConfigs.readOrThrow(true);

    return { name, description, intervalValue, intervalUnit, ...params };
  }

  /**
   * Load existing pjson
   *
   * @returns {Promise<Record<string, any>> | null}
   */
  async loadAssertedPJson(): Promise<Record<string, any> | null> {
    try {
      return fs.readJson(path.join(this.config.assertedDir, 'package.json'));
    } catch {
      return null;
    }
  }

  /**
   * Get new pjson
   *
   * @param {boolean} merge
   * @returns {Promise<Record<string, any>>}
   */
  async getPJson(merge: boolean): Promise<Record<string, any>> {
    const { dependencies } = Dependencies.getLatest();
    const existingPJson = merge ? await this.loadAssertedPJson() : null;

    return existingPJson
      ? {
          ...existingPJson,
          scripts: {
            ...(existingPJson?.scripts || {}),
            prepare: 'npx mkdirp node_modules',
          },
          dependencies,
        }
      : {
          scripts: {
            prepare: 'npx mkdirp node_modules',
          },
          dependencies,
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
    const { merge = false } = params;
    let { projectId, name, description, intervalValue, intervalUnit } = params;

    await this.services.interactions.auth.ensureAuth();

    if (await this.services.routineConfigs.exists()) {
      ({ name, description, intervalUnit, intervalValue } = await this.loadRoutine(params));
    }

    projectId = projectId || (await this.services.interactions.projects.selectProject()).id;

    ({ name, description, intervalValue, intervalUnit } = await this.services.interactions.init.getInitParameters({
      name,
      description,
      intervalValue,
      intervalUnit,
    }));

    await fs.ensureDir(this.config.assertedDir);

    debug('Creating new routine...');
    const { id } = await this.createRoutine(merge, projectId, name, description, intervalUnit, intervalValue);
    this.services.feedback.success('Created routine and wrote config to .asserted/routine.json');

    await fs.writeJson(path.join(this.config.assertedDir, 'package.json'), await this.getPJson(merge), { spaces: 2 });

    if (examples && !merge) {
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
