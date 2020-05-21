import { RoutineConfig } from '@asserted/models';
import { expect } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import sinon from 'sinon';

import { ROUTINE_FILENAME } from '../../../src/lib/constants';
import feedback from '../../../src/lib/services/feedback';
import { RoutineConfigs } from '../../../src/lib/services/routineConfigs';

const OUTPUT_DIR = path.join(__dirname, '../../output');
const RESOURCE_DIR = path.join(__dirname, '../../resources/lib/services/routineConfig');

describe('routineConfig unit tests', () => {
  beforeEach(async () => {
    await fs.remove(OUTPUT_DIR);
    await fs.ensureDir(OUTPUT_DIR);
    sinon.restore();
  });

  after(() => sinon.restore());

  it('write config to disk', async () => {
    const routineConfigs = new RoutineConfigs({ feedback: sinon.stub({ ...feedback }) }, { assertedDir: OUTPUT_DIR });

    const routineConfig = new RoutineConfig({
      id: 'something',
      projectId: 'project-id',
    });

    await routineConfigs.write(routineConfig);

    const createdConfig = await fs.readJson(path.join(OUTPUT_DIR, ROUTINE_FILENAME));
    const expected = {
      id: 'something',
      projectId: 'project-id',
      name: '',
      description: '',
      dependencies: 'v1',
      interval: {
        unit: 'min',
        value: 5,
      },
      mocha: {
        files: ['**/*.asrtd.js'],
        ignore: [],
        bail: false,
        ui: 'bdd',
      },
      timeoutSec: 1,
    };

    expect(createdConfig).to.eql(expected);
  });

  it('read full config', async () => {
    const routineConfigs = new RoutineConfigs({ feedback: sinon.stub({ ...feedback }) }, { assertedDir: path.join(RESOURCE_DIR, 'full') });

    const routineConfig = await routineConfigs.read();

    const expected = {
      id: 'something',
      projectId: 'project-id',
      name: '',
      description: '',
      dependencies: 'v1',
      interval: {
        unit: 'min',
        value: 5,
      },
      mocha: {
        files: ['**/*.asrtd.js'],
        ignore: [],
        bail: false,
        ui: 'bdd',
      },
      timeoutSec: 1,
    };

    expect(routineConfig).to.eql(expected);
  });

  it('read partial config', async () => {
    const routineConfigs = new RoutineConfigs({ feedback: sinon.stub({ ...feedback }) }, { assertedDir: path.join(RESOURCE_DIR, 'partial') });

    const routineConfig = await routineConfigs.read(true);

    const expected = {
      id: '',
      projectId: '',
      name: '',
      description: '',
      dependencies: 'v1',
      interval: {
        unit: 'hr',
        value: 5,
      },
      mocha: {
        files: ['**/*.not-asrtd.js'],
        ignore: [],
        bail: false,
        ui: 'require',
      },
      timeoutSec: 1,
    };

    expect(routineConfig).to.eql(expected);
  });

  it('fail to read invalid config', async () => {
    const routineConfigs = new RoutineConfigs({ feedback: sinon.stub({ ...feedback }) }, { assertedDir: path.join(RESOURCE_DIR, 'invalid') });

    const result = await routineConfigs.read(true).catch((error) => error);
    expect(result.message).to.eql('Invalid routine.json: interval.unit must be one of: min, hr, day');
  });
});
