import { expect } from 'chai';
import sinon from 'sinon';

import { Debug, DEPENDENCIES_VERSIONS } from '@asserted/models';
import { Records } from '../../src/commands/records';
import feedback from '../../src/lib/services/feedback';

const defaultServices = {
  interactions: {} as any,
  localRunner: {} as any,
  routinePacker: {} as any,
  api: {} as any,
  routineConfigs: {} as any,
  feedback: {} as any,
  internalSocket: {} as any,
};

const curDate = new Date('2018-01-01T00:00:00.000Z');

describe('records unit tests', () => {
  beforeEach(() => sinon.restore());

  it('records without routine', async () => {
    const services = {
      ...defaultServices,
      interactions: {
        routines: {
          selectRoutine: sinon.stub().resolves({ id: 'selected-routine-id' }),
        },
      } as any,
      api: {
        records: {
          search: sinon.stub().resolves({ list: [{ id: 'some-record' }], prevBefore: curDate, nextAfter: curDate }),
        },
      } as any,
      feedback: sinon.stub({ ...feedback }),
    };

    sinon.stub(Records, 'getRecordsTable').returns([['foo']]);
    const results = new Records(services);

    await results.records(false, { searchThing: true } as any);

    expect((Records.getRecordsTable as any).args).to.eql([[[{ id: 'some-record' }]]]);
    expect(services.feedback.noIdent.callCount).to.eql(1);
    expect(services.feedback.note.callCount).to.eql(2);
    expect(services.interactions.routines.selectRoutine.callCount).to.eql(1);
    expect(services.api.records.search.args).to.eql([['selected-routine-id', { searchThing: true }]]);
  });

  it('records no passes', async () => {
    const services = {
      ...defaultServices,
      interactions: {
        routines: {
          selectRoutine: sinon.stub().resolves({ id: 'selected-routine-id' }),
        },
      } as any,
      api: {
        records: {
          search: sinon.stub().resolves({
            list: [
              { id: 'id-1', completedAt: true },
              { id: 'id-2', status: 'passed', completedAt: true },
              { id: 'id-3', status: 'passed', completedAt: true },
              { id: 'id-4', completedAt: true },
            ],
            prevBefore: curDate,
            nextAfter: curDate,
          }),
        },
      } as any,
      feedback: sinon.stub({ ...feedback }),
    };

    sinon.stub(Records, 'getRecordsTable').returns([['foo']]);
    const results = new Records(services);

    await results.records(false, { searchThing: true } as any);
    expect((Records.getRecordsTable as any).args).to.eql([
      [
        [
          { id: 'id-4', completedAt: true },
          { start: true, end: true },
          { id: 'id-1', completedAt: true },
        ],
      ],
    ]);
    expect(services.feedback.noIdent.callCount).to.eql(1);
    expect(services.feedback.note.callCount).to.eql(2);
    expect(services.interactions.routines.selectRoutine.callCount).to.eql(1);
    expect(services.api.records.search.args).to.eql([['selected-routine-id', { searchThing: true }]]);
  });

  it('debug normal routine', async () => {
    const routine = {
      id: 'rt-pyZbhZHa6',
      projectId: 'p-efgCYgsz0',
      name: 'do-thing',
      description: '',
      interval: {
        unit: 'min',
        value: 5,
      },
      dependencies: 'v1',
      mocha: {
        files: ['**/*.asrtd.js'],
        ignore: [],
        bail: false,
        ui: 'bdd',
      },
      timeoutSec: 1,
    };

    const packed = {
      package: 'some-pack',
      summary: { foo: 'bar' } as any,
      packageJson: { dependencies: { foo: '1.2.3' } },
      shrinkwrapJson: { dependencies: { foo: '3.2.1' } },
    };

    const services = {
      ...defaultServices,
      routineConfigs: { readOrThrow: sinon.stub().resolves(routine) } as any,
      feedback: sinon.stub({ ...feedback }),
      routinePacker: { pack: sinon.stub().resolves(packed) } as any,
      internalSocket: {
        hasSocket: sinon.stub().resolves(true),
        disconnect: sinon.stub().resolves(),
      } as any,
    };

    const records = new Records(services);
    const completedStub = sinon.stub(records, 'showCompleted');
    const socketStub = sinon.stub(records, 'debugWithSocket').resolves({ id: 'foo-id' } as any);
    const normalStub = sinon.stub(records, 'debugWithoutSocket').resolves({ id: 'foo-id' } as any);

    await records.debug({ bail: false }, false);

    expect(services.routineConfigs.readOrThrow.args).to.eql([[]]);
    expect(services.internalSocket.hasSocket.callCount).to.eql(1);
    expect(services.internalSocket.disconnect.callCount).to.eql(1);
    expect(socketStub.args).to.eql([
      [
        {
          dependencies: 'v1',
          mocha: {
            files: ['**/*.asrtd.js'],
            ignore: [],
            bail: false,
            ui: 'bdd',
          },
          package: 'some-pack',
        },
      ],
    ]);
    expect(normalStub.args).to.eql([]);
    expect(completedStub.args).to.eql([[{ id: 'foo-id' }, false]]);
  });

  it('debug custom routine', async () => {
    const routine = {
      id: 'rt-pyZbhZHa6',
      projectId: 'p-efgCYgsz0',
      name: 'do-thing',
      description: '',
      interval: {
        unit: 'min',
        value: 5,
      },
      dependencies: 'custom',
      mocha: {
        files: ['**/*.asrtd.js'],
        ignore: [],
        bail: false,
        ui: 'bdd',
      },
      timeoutSec: 1,
    };

    const packed = {
      package: 'some-pack',
      summary: { foo: 'bar' } as any,
      packageJson: { dependencies: { foo: '1.2.3' } },
      shrinkwrapJson: { dependencies: { foo: '3.2.1' } },
    };

    const services = {
      ...defaultServices,
      routineConfigs: { readOrThrow: sinon.stub().resolves(routine) } as any,
      routinePacker: { pack: sinon.stub().resolves(packed) } as any,
      feedback: sinon.stub({ ...feedback }),
      internalSocket: {
        hasSocket: sinon.stub().resolves(true),
        disconnect: sinon.stub().resolves(),
      } as any,
    };

    const records = new Records(services);
    const completedStub = sinon.stub(records, 'showCompleted');
    const socketStub = sinon.stub(records, 'debugWithSocket').resolves({ id: 'foo-id' } as any);
    const normalStub = sinon.stub(records, 'debugWithoutSocket').resolves({ id: 'foo-id' } as any);

    await records.debug({ bail: false }, false);

    expect(services.routineConfigs.readOrThrow.args).to.eql([[]]);
    expect(services.internalSocket.hasSocket.callCount).to.eql(1);
    expect(services.internalSocket.disconnect.callCount).to.eql(1);
    expect(socketStub.args).to.eql([
      [
        {
          dependencies: {
            packageJson: { dependencies: { foo: '1.2.3' } },
            shrinkwrapJson: { dependencies: { foo: '3.2.1' } },
          },
          mocha: {
            files: ['**/*.asrtd.js'],
            ignore: [],
            bail: false,
            ui: 'bdd',
          },
          package: 'some-pack',
        },
      ],
    ]);
    expect(normalStub.args).to.eql([]);
    expect(completedStub.args).to.eql([[{ id: 'foo-id' }, false]]);
  });

  it('debug with socket normal', async () => {
    const debugResult = {
      recordId: 'foo-id',
      cachedDependencies: true,
      dependencies: 'v1',
    };

    const services = {
      ...defaultServices,
      feedback: sinon.stub({ ...feedback }),
      api: {
        routines: {
          debugAsync: sinon.stub().resolves(debugResult),
          getDebugRecord: sinon.stub().resolves({ id: 'run-rec-id' }),
        },
      } as any,
      internalSocket: {
        waitForRecord: sinon.stub().resolves({ wait: Promise.resolve() }),
        addRecordId: sinon.stub(),
        waitForBuild: sinon.stub().resolves({ wait: Promise.resolve() }),
        addBuildId: sinon.stub(),
      } as any,
    };

    const debugRun = new Debug({
      dependencies: DEPENDENCIES_VERSIONS.V1,
      mocha: {
        files: ['**/*.asrtd.js'],
        ignore: [],
        bail: false,
        ui: 'bdd' as any,
      },
      package: 'some-pack',
    });

    const records = new Records(services);

    const result = await records.debugWithSocket(debugRun);

    expect(result).to.eql({ id: 'run-rec-id' });
    expect(services.internalSocket.waitForRecord.args).to.eql([[]]);
    expect(services.api.routines.debugAsync.args).to.eql([[debugRun]]);
    expect(services.internalSocket.addRecordId.args).to.eql([['foo-id']]);
    expect(services.internalSocket.waitForBuild.args).to.eql([]);
    expect(services.internalSocket.addBuildId.args).to.eql([]);
    expect(services.api.routines.getDebugRecord.args).to.eql([['foo-id']]);
  });

  it('debug with socket custom cached', async () => {
    const debugResult = {
      recordId: 'foo-id',
      cachedDependencies: true,
      dependencies: 'dep-id',
    };

    const services = {
      ...defaultServices,
      feedback: sinon.stub({ ...feedback }),
      api: {
        routines: {
          debugAsync: sinon.stub().resolves(debugResult),
          getDebugRecord: sinon.stub().resolves({ id: 'run-rec-id' }),
        },
      } as any,
      internalSocket: {
        waitForRecord: sinon.stub().resolves({ wait: Promise.resolve() }),
        addRecordId: sinon.stub(),
        waitForBuild: sinon.stub().resolves({ wait: Promise.resolve() }),
        addBuildId: sinon.stub(),
      } as any,
    };

    const debugRun = new Debug({
      dependencies: {
        packageJson: { dependencies: { foo: '1.2.3' } },
        shrinkwrapJson: { dependencies: { foo: '3.2.1' } },
      },
      mocha: {
        files: ['**/*.asrtd.js'],
        ignore: [],
        bail: false,
        ui: 'bdd' as any,
      },
      package: 'some-pack',
    });

    const records = new Records(services);

    const result = await records.debugWithSocket(debugRun);

    expect(result).to.eql({ id: 'run-rec-id' });
    expect(services.internalSocket.waitForRecord.args).to.eql([[]]);
    expect(services.api.routines.debugAsync.args).to.eql([[debugRun]]);
    expect(services.internalSocket.addRecordId.args).to.eql([['foo-id']]);
    expect(services.internalSocket.waitForBuild.args).to.eql([]);
    expect(services.internalSocket.addBuildId.args).to.eql([]);
    expect(services.api.routines.getDebugRecord.args).to.eql([['foo-id']]);
  });

  it('debug with socket custom not cached', async () => {
    const debugResult = {
      recordId: 'foo-id',
      cachedDependencies: false,
      dependencies: 'dep-id',
    };

    const services = {
      ...defaultServices,
      feedback: sinon.stub({ ...feedback }),
      api: {
        routines: {
          debugAsync: sinon.stub().resolves(debugResult),
          getDebugRecord: sinon.stub().resolves({ id: 'run-rec-id' }),
        },
      } as any,
      internalSocket: {
        waitForRecord: sinon.stub().resolves({ wait: Promise.resolve() }),
        addRecordId: sinon.stub(),
        waitForBuild: sinon.stub().resolves({ wait: Promise.resolve() }),
        addBuildId: sinon.stub(),
      } as any,
    };

    const debugRun = new Debug({
      dependencies: {
        packageJson: { dependencies: { foo: '1.2.3' } },
        shrinkwrapJson: { dependencies: { foo: '3.2.1' } },
      },
      mocha: {
        files: ['**/*.asrtd.js'],
        ignore: [],
        bail: false,
        ui: 'bdd' as any,
      },
      package: 'some-pack',
    });

    const records = new Records(services);
    const result = await records.debugWithSocket(debugRun);

    expect(result).to.eql({ id: 'run-rec-id' });
    expect(services.internalSocket.waitForRecord.args).to.eql([[]]);
    expect(services.api.routines.debugAsync.args).to.eql([[debugRun]]);
    expect(services.internalSocket.addRecordId.args).to.eql([['foo-id']]);
    expect(services.internalSocket.waitForBuild.args).to.eql([[]]);
    expect(services.internalSocket.addBuildId.args).to.eql([['dep-id']]);
    expect(services.api.routines.getDebugRecord.args).to.eql([['foo-id']]);
  });
});
