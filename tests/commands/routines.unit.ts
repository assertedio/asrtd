import {
  INTERVAL_UNITS,
  Routine,
  RoutineConfig as RoutineConfigModel,
  RUN_STATUS,
  TEST_RESULT_STATUS,
  TIMELINE_EVENT_STATUS,
} from '@asserted/models';
import { expect } from 'chai';
import { exec } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import sinon from 'sinon';
import { Dependencies } from '@asserted/runner';

import chalk from 'chalk';
import { Routines } from '../../src/commands/routines';
import { OVERWRITE_ROUTINE } from '../../src/interactions/init';
import feedback from '../../src/lib/services/feedback';
import { RoutineConfigs } from '../../src/lib/services/routineConfigs';
import { getColorOfStatus } from '../../src/lib/services/utils';

const OUTPUT_DIR = path.join(__dirname, '../output');
const RESOURCE_DIR = path.join(__dirname, '../resources/lib/commands/routines');

const defaultServices = {
  interactions: {} as any,
  localRunner: {} as any,
  routinePacker: {} as any,
  api: {} as any,
  globalConfig: {} as any,
  routineConfigs: {} as any,
  feedback: {} as any,
  exec: {} as any,
};

const curDate = new Date('2018-01-01T00:00:00.000Z');

describe('routine command units', () => {
  before(() => {
    chalk.level = 3;
  });

  beforeEach(async () => {
    await fs.remove(OUTPUT_DIR);
    await fs.ensureDir(OUTPUT_DIR);
    sinon.restore();
  });

  after(() => sinon.restore());

  it('run npm install', async function () {
    this.timeout(20000);

    const assertedDir = path.join(OUTPUT_DIR, '.asserted');

    const routine = new Routine({
      ...new RoutineConfigModel({
        id: 'routine-id',
        projectId: 'proj-id',
      }),
      hasPackage: false,
      enabled: false,
      createdAt: curDate,
      updatedAt: curDate,
    });

    const services = {
      ...defaultServices,
      feedback: sinon.stub({ ...feedback }),
      interactions: {
        auth: { ensureAuth: sinon.stub().resolves() },
        init: { getInitParameters: sinon.stub().resolves({}) },
        projects: { selectProject: sinon.stub().resolves({ id: 'proj-selected' }) },
      } as any,
      api: { routines: { create: sinon.stub().resolves(routine) }, projects: { list: sinon.stub().resolves([{ id: 'proj-listed' }]) } } as any,
      routineConfigs: new RoutineConfigs({ feedback: sinon.stub({ ...feedback }) }, { assertedDir }),
      exec,
    };

    const routines = new Routines(services, { assertedDir, appHost: 'http://foo' });

    await routines.initialize({ merge: false, install: true, examples: true });

    expect(await fs.pathExists(assertedDir)).to.eql(true);
    const files = await fs.readdir(assertedDir);
    expect(files).to.eql(['.gitignore', 'examples', 'node_modules', 'package-lock.json', 'package.json', 'routine.json']);
    expect(services.feedback.success.args).to.eql([['Created routine and wrote config to .asserted/routine.json'], ['Initialization complete']]);
  });

  it('new pjson', async () => {
    const services = {
      ...defaultServices,
    };

    const assertedDir = path.join(RESOURCE_DIR, 'dev');

    const routines = new Routines(services, { assertedDir, appHost: 'http://foo' });
    const pjson = await routines.getPJson(false);

    const { dependencies } = Dependencies.getLatest();

    expect(pjson).to.eql({ dependencies, scripts: { prepare: 'npx mkdirp node_modules' } });
  });

  it('merge pjson - load devDeps', async () => {
    const services = {
      ...defaultServices,
    };

    const assertedDir = path.join(RESOURCE_DIR, 'dev');

    const routines = new Routines(services, { assertedDir, appHost: 'http://foo' });
    const pjson = await routines.getPJson(true);

    const { dependencies } = Dependencies.getLatest();

    expect(pjson).to.eql({ dependencies, devDependencies: { bar: 'foo' }, scripts: { prepare: 'npx mkdirp node_modules' } });
  });

  it('merge pjson - load scripts', async () => {
    const services = {
      ...defaultServices,
    };

    const assertedDir = path.join(RESOURCE_DIR, 'scripts');

    const routines = new Routines(services, { assertedDir, appHost: 'http://foo' });
    const pjson = await routines.getPJson(true);

    const { dependencies } = Dependencies.getLatest();

    expect(pjson).to.eql({ dependencies, scripts: { prepare: 'npx mkdirp node_modules', bar: 'foo' } });
  });

  it('initialize with no params', async function () {
    const assertedDir = path.join(OUTPUT_DIR, '.asserted');

    const services = {
      ...defaultServices,
      feedback: sinon.stub({ ...feedback }),
      interactions: {
        auth: { ensureAuth: sinon.stub().resolves() },
        init: { getInitParameters: sinon.stub().resolves({ name: 'some-name', description: 'desc', intervalValue: 4, intervalUnit: 'hr' }) },
        projects: { selectProject: sinon.stub().resolves({ id: 'selected-proj-id' }) },
      } as any,
      routineConfigs: {
        exists: sinon.stub().resolves(false),
      } as any,
      exec: sinon.stub(),
    };

    const routines = new Routines(services, { assertedDir, appHost: 'http://foo' });
    sinon.stub(routines, 'createRoutine').resolves({ id: 'routine-id' } as any);
    sinon.stub(routines, 'installPackages').resolves();

    await routines.initialize({ merge: false, install: true, examples: true });

    expect(services.interactions.auth.ensureAuth.callCount).to.eql(1);
    expect(services.interactions.init.getInitParameters.args).to.eql([
      [{ name: undefined, description: undefined, intervalValue: undefined, intervalUnit: undefined }],
    ]);
    expect(services.interactions.projects.selectProject.callCount).to.eql(1);

    expect((routines.createRoutine as any).args).to.eql([[false, 'selected-proj-id', 'some-name', 'desc', 'hr', 4]]);
    expect((routines.installPackages as any).callCount).to.eql(1);

    expect(services.feedback.success.args).to.eql([['Created routine and wrote config to .asserted/routine.json'], ['Initialization complete']]);
    expect(services.feedback.error.args).to.eql([]);
    expect(services.feedback.warn.args).to.eql([]);
    expect(services.feedback.note.args).to.eql([]);
    expect(services.feedback.info.args).to.eql([
      ["Use '\u001B[32masrtd run\u001B[39m' to run the tests locally, then '\u001B[32masrtd push\u001B[39m' to run them continuously online."],
      [
        'Go to routine settings to configure notifications: \u001B[34m\u001B]8;;http://foo/routines/routine-id/settings\u0007http://foo/routines/routine-id/settings\u001B]8;;\u0007\u001B[39m',
      ],
    ]);

    expect(await fs.pathExists(assertedDir)).to.eql(true);

    const files = await fs.readdir(assertedDir);

    expect(files).to.eql(['.gitignore', 'examples', 'package.json']);
  });

  it('initialize with all params', async () => {
    const assertedDir = path.join(OUTPUT_DIR, '.asserted');

    const services = {
      ...defaultServices,
      feedback: sinon.stub({ ...feedback }),
      interactions: {
        auth: { ensureAuth: sinon.stub().resolves() },
        init: { getInitParameters: sinon.stub().resolves({ name: 'some-other-name', description: 'desc', intervalValue: 4, intervalUnit: 'min' }) },
      } as any,
      routineConfigs: {
        exists: sinon.stub().resolves(false),
      } as any,
      exec: sinon.stub(),
    };

    const routines = new Routines(services, { assertedDir, appHost: 'http://foo' });
    sinon.stub(routines, 'createRoutine').resolves({ id: 'routine-id' } as any);
    sinon.stub(routines, 'installPackages').resolves();

    const initParams = {
      verify: false,
      install: false,
      examples: false,
      id: 'routine-id',
      projectId: 'proj-id',
      name: 'some-name',
      description: 'some-desc',
      intervalUnit: 'hr' as any,
      intervalValue: 10,
    };

    await routines.initialize(initParams);

    expect(services.interactions.auth.ensureAuth.callCount).to.eql(1);
    expect(services.interactions.init.getInitParameters.args).to.eql([
      [
        {
          name: 'some-name',
          description: 'some-desc',
          intervalValue: 10,
          intervalUnit: 'hr',
        },
      ],
    ]);

    expect((routines.createRoutine as any).args).to.eql([[false, 'proj-id', 'some-other-name', 'desc', 'min', 4]]);
    expect((routines.installPackages as any).callCount).to.eql(0); // no install

    expect(services.feedback.success.args).to.eql([['Created routine and wrote config to .asserted/routine.json'], ['Initialization complete']]);
    expect(services.feedback.error.args).to.eql([]);
    expect(services.feedback.warn.args).to.eql([
      ['Skipping copy of example tests'],
      ["Skipping asserted dependency install. Run 'npm install' in the .asserted directory if needed."],
    ]);
    expect(services.feedback.note.args).to.eql([]);
    expect(services.feedback.info.args).to.eql([
      ["Use '\u001B[32masrtd run\u001B[39m' to run the tests locally, then '\u001B[32masrtd push\u001B[39m' to run them continuously online."],
      [
        'Go to routine settings to configure notifications: \u001B[34m\u001B]8;;http://foo/routines/routine-id/settings\u0007http://foo/routines/routine-id/settings\u001B]8;;\u0007\u001B[39m',
      ],
    ]);

    expect(await fs.pathExists(assertedDir)).to.eql(true);

    const files = await fs.readdir(assertedDir);

    expect(files).to.eql(['.gitignore', 'package.json']);
  });

  it('create routine', async () => {
    const assertedDir = path.join(OUTPUT_DIR, '.asserted');

    const routine = new Routine({
      ...new RoutineConfigModel({
        id: 'created-routine',
        projectId: 'proj-id',
      }),
      hasPackage: false,
      enabled: false,
      createdAt: curDate,
      updatedAt: curDate,
    });

    const services = {
      ...defaultServices,
      feedback: sinon.stub({ ...feedback }),
      interactions: {} as any,
      api: {
        routines: {
          create: sinon.stub().resolves(routine),
        },
      } as any,
      routineConfigs: {
        write: sinon.stub().resolves(),
      } as any,
      exec: sinon.stub(),
    };

    const routines = new Routines(services, { assertedDir, appHost: 'http://foo' });

    await routines.createRoutine(false, 'proj-id', 'some-name', 'some-desc', 'min', 12);

    expect(services.api.routines.create.args).to.eql([
      [
        {
          projectId: 'proj-id',
          name: 'some-name',
          description: 'some-desc',
          mocha: undefined,
          dependencies: undefined,
          interval: {
            unit: 'min',
            value: 12,
          },
          timeoutSec: undefined,
        },
      ],
    ]);
    expect(services.routineConfigs.write.args).to.eql([[routine.toRoutineConfig()]]);
  });

  it('create routine - merge existing', async () => {
    const assertedDir = path.join(OUTPUT_DIR, '.asserted');

    const routine = new Routine({
      ...new RoutineConfigModel({
        id: 'created-routine',
        projectId: 'proj-id',
      }),
      hasPackage: false,
      enabled: false,
      createdAt: curDate,
      updatedAt: curDate,
    });

    const existingRoutine = {
      id: 'rt-FYt',
      projectId: 'p-1HZ',
      name: 'do-thing',
      description: '',
      interval: {
        unit: 'hr',
        value: 5,
      },
      dependencies: 'v1',
      mocha: {
        files: ['**/*.asrtd.js'],
        ignore: [],
        bail: false,
        ui: 'bdd',
      },
      timeoutSec: 10,
    };

    const services = {
      ...defaultServices,
      feedback: sinon.stub({ ...feedback }),
      interactions: {} as any,
      api: {
        routines: {
          create: sinon.stub().resolves(routine),
        },
      } as any,
      routineConfigs: {
        write: sinon.stub().resolves(),
        read: sinon.stub().resolves(existingRoutine),
      } as any,
      exec: sinon.stub(),
    };

    const routines = new Routines(services, { assertedDir, appHost: 'http://foo' });

    await routines.createRoutine(true, 'proj-id', 'some-name', 'some-desc', 'min', 12);

    expect(services.api.routines.create.args).to.eql([
      [
        {
          projectId: 'proj-id',
          name: 'some-name',
          description: 'some-desc',
          mocha: existingRoutine.mocha,
          dependencies: 'v1',
          interval: {
            unit: 'min',
            value: 12,
          },
          timeoutSec: 10,
        },
      ],
    ]);
    expect(services.routineConfigs.write.args).to.eql([[routine.toRoutineConfig()]]);
  });

  it('list routines - undefined project', async () => {
    const services = {
      ...defaultServices,
      feedback: sinon.stub({ ...feedback }),
      interactions: {
        projects: {
          selectProject: sinon.stub().resolves({ id: 'selected-proj-id' }),
        },
      } as any,
      api: {
        routines: {
          list: sinon.stub().resolves([{ projectId: 'proj-1' }, { projectId: 'proj-2' }]),
        },
      } as any,
      exec: sinon.stub(),
    };

    const routines = new Routines(services, {} as any);

    await routines.list();

    expect(services.interactions.projects.selectProject.callCount).to.eql(1);
    expect(services.api.routines.list.args).to.eql([['selected-proj-id']]);
    expect(services.feedback.noIdent.callCount).to.eql(1);
  });

  it('list routines - with project', async () => {
    const services = {
      ...defaultServices,
      feedback: sinon.stub({ ...feedback }),
      interactions: {
        projects: {
          selectProject: sinon.stub().resolves({ id: 'selected-proj-id' }),
        },
      } as any,
      api: {
        routines: {
          list: sinon.stub().resolves([{ projectId: 'proj-1' }, { projectId: 'proj-2' }]),
        },
      } as any,
    };

    const routines = new Routines(services, {} as any);

    await routines.list('proj');

    expect(services.interactions.projects.selectProject.callCount).to.eql(0);
    expect(services.api.routines.list.args).to.eql([['proj']]);
    expect(services.feedback.noIdent.callCount).to.eql(1);
  });

  it('remove routine - routine unefined', async () => {
    const services = {
      ...defaultServices,
      feedback: sinon.stub({ ...feedback }),
      interactions: {
        routines: {
          selectRoutine: sinon.stub().resolves({ id: 'selected-routine-id' }),
          confirmDelete: sinon.stub().resolves(true),
        },
      } as any,
      api: {
        routines: {
          remove: sinon.stub().resolves(),
        },
      } as any,
    };

    const routines = new Routines(services, {} as any);

    await routines.remove();

    expect(services.interactions.routines.selectRoutine.callCount).to.eql(1);
    expect(services.interactions.routines.confirmDelete.callCount).to.eql(1);
    expect(services.api.routines.remove.args).to.eql([['selected-routine-id']]);
    expect(services.feedback.success.callCount).to.eql(1);
  });

  it('remove routine - with routine', async () => {
    const services = {
      ...defaultServices,
      feedback: sinon.stub({ ...feedback }),
      interactions: {
        routines: {
          selectRoutine: sinon.stub().resolves({ id: 'selected-routine-id' }),
          confirmDelete: sinon.stub().resolves(true),
        },
      } as any,
      api: {
        routines: {
          remove: sinon.stub().resolves(),
        },
      } as any,
    };

    const routines = new Routines(services, {} as any);

    await routines.remove('routine-id');

    expect(services.interactions.routines.selectRoutine.callCount).to.eql(0);
    expect(services.interactions.routines.confirmDelete.callCount).to.eql(1);
    expect(services.api.routines.remove.args).to.eql([['routine-id']]);
    expect(services.feedback.success.callCount).to.eql(1);
  });

  it('remove routine - with routine and force', async () => {
    const services = {
      ...defaultServices,
      feedback: sinon.stub({ ...feedback }),
      interactions: {
        routines: {
          selectRoutine: sinon.stub().resolves({ id: 'selected-routine-id' }),
          confirmDelete: sinon.stub().resolves(true),
        },
      } as any,
      api: {
        routines: {
          remove: sinon.stub().resolves(),
        },
      } as any,
    };

    const routines = new Routines(services, {} as any);

    await routines.remove('routine-id', true);

    expect(services.interactions.routines.selectRoutine.callCount).to.eql(0);
    expect(services.interactions.routines.confirmDelete.callCount).to.eql(0);
    expect(services.api.routines.remove.args).to.eql([['routine-id']]);
    expect(services.feedback.success.callCount).to.eql(1);
  });

  it('enable routine - routine unefined', async () => {
    const services = {
      ...defaultServices,
      feedback: sinon.stub({ ...feedback }),
      interactions: {
        routines: {
          selectRoutine: sinon.stub().resolves({ id: 'selected-routine-id' }),
        },
      } as any,
      api: {
        routines: {
          enable: sinon.stub().resolves(),
        },
      } as any,
    };

    const routines = new Routines(services, {} as any);

    await routines.enable();

    expect(services.interactions.routines.selectRoutine.callCount).to.eql(1);
    expect(services.api.routines.enable.args).to.eql([['selected-routine-id']]);
    expect(services.feedback.success.callCount).to.eql(1);
  });

  it('enable routine - with routine', async () => {
    const services = {
      ...defaultServices,
      feedback: sinon.stub({ ...feedback }),
      interactions: {
        routines: {
          selectRoutine: sinon.stub().resolves({ id: 'selected-routine-id' }),
        },
      } as any,
      api: {
        routines: {
          enable: sinon.stub().resolves(),
        },
      } as any,
    };

    const routines = new Routines(services, {} as any);

    await routines.enable('routine-id');

    expect(services.interactions.routines.selectRoutine.callCount).to.eql(0);
    expect(services.api.routines.enable.args).to.eql([['routine-id']]);
    expect(services.feedback.success.callCount).to.eql(1);
  });

  it('disable routine - routine unefined', async () => {
    const services = {
      ...defaultServices,
      feedback: sinon.stub({ ...feedback }),
      interactions: {
        routines: {
          selectRoutine: sinon.stub().resolves({ id: 'selected-routine-id' }),
        },
      } as any,
      api: {
        routines: {
          disable: sinon.stub().resolves(),
        },
      } as any,
    };

    const routines = new Routines(services, {} as any);

    await routines.disable();

    expect(services.interactions.routines.selectRoutine.callCount).to.eql(1);
    expect(services.api.routines.disable.args).to.eql([['selected-routine-id']]);
    expect(services.feedback.success.callCount).to.eql(1);
  });

  it('disable routine - with routine', async () => {
    const services = {
      ...defaultServices,
      feedback: sinon.stub({ ...feedback }),
      interactions: {
        routines: {
          selectRoutine: sinon.stub().resolves({ id: 'selected-routine-id' }),
        },
      } as any,
      api: {
        routines: {
          disable: sinon.stub().resolves(),
        },
      } as any,
    };

    const routines = new Routines(services, {} as any);

    await routines.disable('routine-id');

    expect(services.interactions.routines.selectRoutine.callCount).to.eql(0);
    expect(services.api.routines.disable.args).to.eql([['routine-id']]);
    expect(services.feedback.success.callCount).to.eql(1);
  });
});

describe('load routine', () => {
  beforeEach(async () => {
    await fs.remove(OUTPUT_DIR);
    await fs.ensureDir(OUTPUT_DIR);
    sinon.restore();
  });

  it('overwrite if selected', async () => {
    const services = {
      ...defaultServices,
      feedback: sinon.stub({ ...feedback }),
      interactions: {
        init: {
          confirmOverwrite: sinon.stub().resolves(OVERWRITE_ROUTINE.OVERWRITE),
        },
      } as any,
      routineConfigs: {
        readOrThrow: sinon.stub().resolves({}),
      } as any,
      exec: sinon.stub(),
    };

    const routines = new Routines(services, {} as any);

    const provided = { name: 'foo', description: 'bar', intervalValue: 12, intervalUnit: INTERVAL_UNITS.DAY };

    const result = await routines.loadRoutine(provided as any);
    expect(result).to.eql(provided);
  });

  it('merge if selected', async () => {
    const routine = new Routine({
      ...new RoutineConfigModel({
        id: 'created-routine',
        projectId: 'proj-id',
        name: 'some-name',
        description: 'some-desc',
      }),
      hasPackage: false,
      enabled: false,
      createdAt: curDate,
      updatedAt: curDate,
    });

    const services = {
      ...defaultServices,
      feedback: sinon.stub({ ...feedback }),
      interactions: {
        init: {
          confirmOverwrite: sinon.stub().resolves(OVERWRITE_ROUTINE.MERGE),
        },
      } as any,
      routineConfigs: {
        readOrThrow: sinon.stub().resolves(routine),
      } as any,
      exec: sinon.stub(),
    };

    const routines = new Routines(services, {} as any);

    const provided = { name: 'foo', intervalUnit: INTERVAL_UNITS.DAY };

    const result = await routines.loadRoutine(provided as any);
    expect(result).to.eql({ name: 'foo', intervalUnit: INTERVAL_UNITS.DAY, intervalValue: 5, description: routine.description });
  });
});

describe('routine console unit tests', () => {
  before(() => {
    // eslint-disable-next-line no-process-env
    process.env.FORCE_COLOR = '3';
  });

  after(() => {
    // eslint-disable-next-line no-process-env
    delete process.env.FORCE_COLOR;
  });

  it('get routine table data', () => {
    const routines = [
      {
        id: 'id-1',
        name: 'name-1',
        enabled: true,
        hasPackage: false,
        isActive: () => false,
      },
      {
        id: 'id-2',
        name: 'name-2',
        enabled: false,
        hasPackage: true,
        isActive: () => true,
      },
    ];

    const tableData = Routines.getRoutineTableData(routines as any, false);

    expect(tableData).to.eql([
      [
        '\u001B[34m\u001B[1mRoutine ID\u001B[22m\u001B[39m',
        '\u001B[34m\u001B[1mRoutine Name\u001B[22m\u001B[39m',
        '\u001B[34m\u001B[1mStatus\u001B[22m\u001B[39m',
      ],
      ['id-1', 'name-1', '\u001B[34mNot Pushed\u001B[39m'],
      ['id-2', 'name-2', '\u001B[34mDisabled\u001B[39m'],
    ]);
  });

  it('get color of status', () => {
    expect(getColorOfStatus(TIMELINE_EVENT_STATUS.UP)).to.eql('green');
    expect(getColorOfStatus(TEST_RESULT_STATUS.PASSED)).to.eql('green');
    expect(getColorOfStatus(RUN_STATUS.PASSED)).to.eql('green');

    expect(getColorOfStatus(TIMELINE_EVENT_STATUS.IMPAIRED)).to.eql('yellow');
    expect(getColorOfStatus(RUN_STATUS.CREATED)).to.eql('yellow');

    expect(getColorOfStatus(TIMELINE_EVENT_STATUS.DOWN)).to.eql('red');
    expect(getColorOfStatus(TEST_RESULT_STATUS.FAILED)).to.eql('red');
    expect(getColorOfStatus(RUN_STATUS.FAILED)).to.eql('red');

    expect(getColorOfStatus(TEST_RESULT_STATUS.PENDING)).to.eql('blue');
    expect(getColorOfStatus(TIMELINE_EVENT_STATUS.TIMEOUT)).to.eql('blue');
    expect(getColorOfStatus(TIMELINE_EVENT_STATUS.UNKNOWN)).to.eql('blue');
    expect(getColorOfStatus('random' as any)).to.eql('blue');
  });
});
