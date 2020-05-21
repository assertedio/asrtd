import { CompletedRunRecord, RoutineConfigInterface, Run, RUN_TYPE, RunRecord } from '@asserted/models';
import { Runner } from '@asserted/runner';
import fs from 'fs-extra';
import { DateTime } from 'luxon';
import * as os from 'os';
import path from 'path';

import getLogger from '../../logger';
import { RoutineConfigs } from './routineConfigs';

const log = getLogger('localRunner');

interface ServicesInterface {
  runner: Runner;
  routineConfigs: RoutineConfigs;
}

interface ConfigInterface {
  assertedDir: string;
}

export interface RunInterface {
  files?: string[];
  ignore?: string[];
  bail: boolean;
}

/**
 * @class
 */
export class LocalRunner {
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
   * Run tests locally
   *
   * @param {RoutineConfigInterface} routine
   * @param {Date} curDate
   * @returns {Promise<CompletedRunRecord | null>}
   */
  async run(routine: RoutineConfigInterface, curDate = DateTime.utc().toJSDate()): Promise<CompletedRunRecord | null> {
    log(`Running routine: ${JSON.stringify(routine)}`);

    const { mocha, timeoutSec, dependencies, id, projectId } = routine;

    const mochaPath = path.join(this.config.assertedDir, '/node_modules/mocha/bin/mocha');
    const reporterPath = require.resolve('mocha-ldjson');

    if (!(await fs.pathExists(mochaPath))) {
      throw new Error("mocha not found in .asserted/node_modules, run 'npm i' in .asserted/");
    }

    await this.services.routineConfigs.dependenciesWarning();

    // eslint-disable-next-line no-magic-numbers
    const run = Run.create({ mocha, timeoutMs: timeoutSec * 1000, package: '', type: RUN_TYPE.MANUAL, dependencies }, curDate);
    const outputPath = await fs.mkdtemp(path.join(os.tmpdir(), 'asserted-'));

    try {
      const runRecord = RunRecord.create(run, projectId, id);
      const testResult = await this.services.runner.run({ ...run, outputPath, mochaPath, testRoot: this.config.assertedDir, reporterPath }, true);
      const completedRunRecord = new CompletedRunRecord({ ...runRecord, ...RunRecord.getPatchFromResult(testResult) });
      await fs.remove(outputPath);
      return completedRunRecord;
    } catch (error) {
      await fs.remove(outputPath).catch((error_) => log(`error while removing tmp dir: ${error_.message}`));
      return null;
    }
  }
}
