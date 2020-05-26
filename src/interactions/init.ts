import { INTERVAL_UNITS, Routine } from '@asserted/models';
import { promises as fs } from 'fs';
import inquirer from 'inquirer';
import { isInteger } from 'lodash';
import path from 'path';
import { adjectives, starWars, uniqueNamesGenerator } from 'unique-names-generator';

import { ROUTINE_FILENAME } from '../lib/constants';
import { InitRoutineInterface } from '../lib/models/init';

export interface ConfigInterface {
  assertedDir: string;
}

export enum OVERWRITE_ROUTINE {
  ABORT = 'abort',
  OVERWRITE = 'wipe existing .asserted and recreate',
  MERGE = 'create only new routine ID and merge with existing .asserted',
}

/**
 * @class
 */
export class Init {
  private readonly config: ConfigInterface;

  /**
   * @param {{}} services
   * @param {ConfigInterface} config
   */
  constructor(services, config: ConfigInterface) {
    this.config = config;
  }

  /**
   * Generate routine name
   *
   * @param {string} assertedDir
   * @returns {Promise<string>}
   */
  static async generateRoutineName(assertedDir: string): Promise<string> {
    const pjsonPath = path.join(assertedDir, '../package.json');
    const parentDirPath = path.basename(path.join(assertedDir, '../'));

    const stats = await fs.stat(pjsonPath).catch(() => null);
    let projectName = null as string | null;
    if (stats && stats.isFile()) {
      try {
        projectName = JSON.parse(await fs.readFile(pjsonPath, 'utf8')).name;
      } catch {
        projectName = null;
      }
    }

    projectName = projectName || parentDirPath.length > 0 ? parentDirPath : null;

    return projectName || uniqueNamesGenerator({ separator: ' ', length: 2, dictionaries: [adjectives, starWars], style: 'lowerCase' });
  }

  /* eslint-disable class-methods-use-this */
  /**
   * Confirm overwrite
   *
   * @returns {OVERWRITE_ROUTINE}
   */
  async confirmOverwrite(): Promise<OVERWRITE_ROUTINE> {
    const { confirm } = await inquirer.prompt([
      {
        type: 'list',
        name: 'confirm',
        message: `${ROUTINE_FILENAME} already exists. Abort, overwrite, or merge?`,
        default: OVERWRITE_ROUTINE.ABORT,
        choices: Object.values(OVERWRITE_ROUTINE),
      },
    ]);

    return confirm;
  }
  /* eslint-enable class-methods-use-this */

  /* eslint-disable sonarjs/cognitive-complexity */
  /**
   * Get init parameters
   *
   * @param {InitParametersInterface} params
   * @param {{}} defaultValues
   * @returns {Promise<InitParametersInterface>}
   */
  async getInitParameters(
    params: InitRoutineInterface,
    defaultValues = {} as InitRoutineInterface
  ): Promise<{ name: string; description: string; intervalUnit: INTERVAL_UNITS; intervalValue: number }> {
    const prompts = [] as any[];

    if (!params.name) {
      prompts.push({
        default: defaultValues?.name || (await Init.generateRoutineName(this.config.assertedDir)),
        type: 'input',
        name: 'name',
        message: 'Enter routine name (up to 50 chars):',
        validate: (input) => !input || (input && input.length < Routine.CONSTANTS.NAME_MAX_LENGTH),
      });
    }

    if (!params.description) {
      prompts.push({
        type: 'input',
        name: 'description',
        default: defaultValues?.description || undefined,
        message: 'Optionally enter description (up to 200 chars):',
        validate: (input) => !input || (input && input.length < Routine.CONSTANTS.DESCRIPTION_MAX_LENGTH),
      });
    }

    if (!params.intervalUnit) {
      prompts.push({
        type: 'list',
        name: 'intervalUnit',
        message: 'Unit of test interval:',
        default: defaultValues?.intervalUnit || INTERVAL_UNITS.MIN,
        choices: Object.values(INTERVAL_UNITS),
      });
    }

    if (!params.intervalValue) {
      prompts.push({
        type: 'number',
        name: 'intervalValue',
        message: (session) => `Run test every X ${session.intervalUnit} (integer > 0):`,
        // eslint-disable-next-line no-magic-numbers
        default: (session) => defaultValues?.intervalValue || (session.intervalUnit === INTERVAL_UNITS.MIN ? 5 : 1),
        validate: (value) => value && Number.parseInt(value, 10) > 0 && isInteger(Number.parseInt(value, 10)),
      });
    }

    const response = prompts.length > 1 ? ((await inquirer.prompt(prompts)) as any) : {};

    return { ...params, ...defaultValues, ...response };
  }
  /* eslint-enable sonarjs/cognitive-complexity */
}
