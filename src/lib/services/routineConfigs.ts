import { DEPENDENCIES_VERSIONS, RoutineConfig } from '@asserted/models';
import { Dependencies } from '@asserted/runner';
import alce from 'alce';
import * as fs from 'fs-extra';
import path from 'path';

import logger from '../../logger';
import { ROUTINE_FILENAME } from '../constants';
import { FeedbackInterface } from './feedback';

const log = logger('routineConfig');

const KEY_ORDER = ['id', 'projectId', 'name', 'description', 'interval'];

interface ServicesInterface {
  feedback: FeedbackInterface;
}

interface ConfigInterface {
  assertedDir: string;
}

/**
 * @class
 */
export class RoutineConfigs {
  private readonly services: ServicesInterface;

  private readonly config: ConfigInterface;

  /**
   * @param {{}} services
   * @param {ConfigInterface} config
   */
  constructor(services: ServicesInterface, config: ConfigInterface) {
    this.services = services;
    this.config = config;
  }

  /**
   * Get path based on cwd
   *
   * @returns {string}
   */
  getPath(): string {
    return path.join(this.config.assertedDir, ROUTINE_FILENAME);
  }

  /**
   * Read routine config
   *
   * @param {boolean} safe
   * @returns {Promise<RoutineConfig | null>}
   */
  async read(safe = false): Promise<RoutineConfig | null> {
    if (await this.exists()) {
      let parsedRoutine;

      try {
        parsedRoutine = alce.parse(await fs.readFile(this.getPath()));
      } catch {
        throw new Error(`Could not parse: ${path.join(ROUTINE_FILENAME)}`);
      }

      try {
        return new RoutineConfig(safe ? { ...parsedRoutine, id: '', projectId: '' } : parsedRoutine);
      } catch (error) {
        throw new Error(`Invalid routine.json: ${error.message}`);
      }
    }

    return null;
  }

  /**
   * Show dependencies warning
   *
   * @returns {Promise<void>}
   */
  async dependenciesWarning(): Promise<void> {
    const routine = await this.readOrThrow();

    if (routine.dependencies === DEPENDENCIES_VERSIONS.CUSTOM) {
      return;
    }

    const extra = await Dependencies.findExtra(this.config.assertedDir);

    if (extra.length > 0) {
      this.services.feedback.warn('Found unexpected additional dependencies in .asserted/package.json.');
      this.services.feedback.warn(`Only packages included in ${routine?.dependencies} dependencies will be available when pushed.`);
      this.services.feedback.warn('Extra dependencies: ');
      extra.map((_extra) => this.services.feedback.warn(`- ${_extra}`));
      this.services.feedback.warn('If not required to run the routine, put these extra dependencies in devDependencies');
      this.services.feedback.warn('If required, upgrade to a paid plan and set "dependencies" to "custom" in routine.json');
    }
  }

  /**
   * Get routine ID from local config
   *
   * @returns {string}
   */
  async getRoutineId(): Promise<string | undefined> {
    const routine = await this.read();
    return routine?.id;
  }

  /**
   * Get project ID from local config
   *
   * @returns {string}
   */
  async getProjectId(): Promise<string | undefined> {
    const routine = await this.read();
    return routine?.projectId;
  }

  /**
   * Read or throw
   *
   * @param {boolean} safe
   * @returns {Promise<RoutineConfig>}
   */
  async readOrThrow(safe = false): Promise<RoutineConfig> {
    const routine = await this.read(safe);

    if (!routine) {
      throw new Error('no routine config found in .asserted/');
    }

    return routine;
  }

  /**
   * Routine exists
   *
   * @returns {Promise<boolean>}
   */
  async exists(): Promise<boolean> {
    return fs.pathExists(this.getPath()).catch(() => false);
  }

  /**
   * Write routine to disk
   *
   * @param {Routine} routine
   * @returns {Promise<void>}
   */
  async write(routine: RoutineConfig): Promise<void> {
    const routineKeys = Object.keys(routine);
    const sortedKeys = KEY_ORDER.filter((key) => routineKeys.includes(key)).concat(routineKeys.filter((key) => !KEY_ORDER.includes(key)).sort());

    const sortedRoutine = sortedKeys.reduce((result, key) => {
      result[key] = routine[key];
      return result;
    }, {} as any);

    log(`Ensuring ${this.config.assertedDir} exists`);
    await fs.ensureDir(this.config.assertedDir);
    log(`Writing routine to: ${this.getPath()}`);
    await fs.writeJSON(this.getPath(), sortedRoutine, { spaces: 2 });
  }
}
