import { RoutineConfig as RoutineConfigModel, TestResultInterface } from '@asserted/models';
import { expect } from 'chai';
import fs from 'fs-extra';
import { omit } from 'lodash';
import { DateTime } from 'luxon';
import path from 'path';
import sinon from 'sinon';

import { LocalRunner } from '../../../src/lib/services/localRunner';

// Only doing this because run() checks to see if mocha is in the node_modules of this dir
const WORKING_DIR = process.cwd();

describe('localrunner unit tests', () => {
  after(() => sinon.restore());

  it('run test', async () => {
    const curDate = DateTime.fromISO('2018-01-01T00:00:00.000Z').toJSDate();

    const testResult: TestResultInterface = {
      runId: 'run-id',
      type: 'manual' as any,
      console: null,
      error: null,
      events: [],
      timeoutType: null,
      runDurationMs: 10,
      createdAt: curDate,
    };

    const services = {
      runner: {
        run: sinon.stub().resolves(testResult),
      } as any,
      routineConfigs: {
        dependenciesWarning: sinon.stub().resolves(),
      } as any,
    };
    const localRunner = new LocalRunner(services, { assertedDir: WORKING_DIR });

    const routine = new RoutineConfigModel({
      id: 'foo-id',
      projectId: 'proj-id',
    });

    const completedRun = await localRunner.run(routine, curDate);

    const expected = {
      projectId: 'proj-id',
      routineId: 'foo-id',
      stats: null,
      runDurationMs: 10,
      testDurationMs: null,
      type: 'manual',
      console: null,
      error: null,
      status: 'failed',
      failType: 'error',
      timeoutType: null,
      completedAt: curDate,
      results: [],
    };

    const expectedArgs = {
      type: 'manual',
      package: '',
      dependencies: 'v1',
      mocha: {
        files: ['**/*.asrtd.js'],
        ignore: [],
        bail: false,
        ui: 'bdd',
      },
      timeoutMs: 1000,
      createdAt: curDate,
      mochaPath: path.join(WORKING_DIR, 'node_modules/mocha/bin/mocha'),
      testRoot: WORKING_DIR,
      reporterPath: path.join(WORKING_DIR, 'node_modules/mocha-ldjson/dist/src/index.js'),
    };

    expect(services.routineConfigs.dependenciesWarning.callCount).to.eql(1);
    expect(services.runner.run.callCount).to.eql(1);
    expect(omit(services.runner.run.args[0][0], ['id', 'outputPath'])).to.eql(expectedArgs);
    expect(services.runner.run.args[0][0].outputPath.startsWith('/tmp/asserted-')).to.eql(true);
    expect(await fs.pathExists(services.runner.run.args[0][0].outputPath)).to.eql(false);
    expect(omit(completedRun, ['id', 'runId'])).to.eql(expected);
  });
});
