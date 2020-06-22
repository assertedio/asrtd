/* eslint-disable class-methods-use-this */
import { createPackage } from '@asserted/pack';
import fs from 'fs-extra';
import { Readable } from 'stream';
import tar from 'tar';
import path from 'path';
import shrinkwrap from '@asserted/shrinkwrap';

import { DependenciesInterface } from '@asserted/models';
import { RoutineConfigs } from './routineConfigs';

interface ServicesInterface {
  routineConfigs: RoutineConfigs;
}

interface ConfigInterface {
  assertedDir: string;
}

interface PackedRoutineInterface extends DependenciesInterface {
  package: string;
  summary: any;
}

/**
 * @class
 */
export class RoutinePacker {
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
   * Pack directory into base64 string
   *
   * @returns {Promise<string>}
   */
  async pack(): Promise<PackedRoutineInterface> {
    await this.services.routineConfigs.dependenciesWarning();

    if (!(await fs.pathExists(path.join(this.config.assertedDir, 'package.json')))) {
      throw new Error('package.json not found in .asserted');
    }

    return new Promise((resolve) => {
      const result = {} as PackedRoutineInterface;
      createPackage(this.config.assertedDir, async ({ target, summary }) => {
        result.package = await fs.readFile(target, 'base64');
        result.summary = summary;
        result.packageJson = await fs.readJson(path.join(this.config.assertedDir, 'package.json'));
        result.shrinkwrapJson = await shrinkwrap(this.config.assertedDir);
      }).then(() => resolve(result));
    });
  }

  /**
   * Unpack tar string into directory
   *
   * @param {string} fileString
   * @param {string} directory
   * @returns {Promise<void>}
   */
  async unpack(fileString: string, directory: string): Promise<void> {
    const stream = new Readable();
    stream.push(fileString, 'base64');
    stream.push(null);
    await new Promise((resolve) => stream.pipe(tar.x({ C: directory })).on('close', () => resolve()));
  }
}
/* eslint-enable class-methods-use-this */
