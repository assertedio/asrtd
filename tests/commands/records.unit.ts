import { expect } from 'chai';
import sinon from 'sinon';

import { Records } from '../../src/commands/records';
import feedback from '../../src/lib/services/feedback';

const defaultServices = {
  interactions: {} as any,
  localRunner: {} as any,
  routinePacker: {} as any,
  api: {} as any,
  routineConfigs: {} as any,
  feedback: {} as any,
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
      api: { routines: { debug: sinon.stub().resolves({ id: 'foo-id' }) } } as any,
      routineConfigs: { readOrThrow: sinon.stub().resolves(routine) } as any,
      routinePacker: { pack: sinon.stub().resolves(packed) } as any,
      feedback: sinon.stub({ ...feedback }),
    };

    const records = new Records(services);
    const completedStub = sinon.stub(records, 'showCompleted');

    await records.debug({ bail: false }, false);

    expect(services.routineConfigs.readOrThrow.args).to.eql([[]]);
    expect(services.routinePacker.pack.args).to.eql([[]]);
    expect(services.api.routines.debug.args).to.eql([[{ mocha: routine.mocha, package: 'some-pack', dependencies: 'v1' }]]);
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
      api: { routines: { debug: sinon.stub().resolves({ id: 'foo-id' }) } } as any,
      routineConfigs: { readOrThrow: sinon.stub().resolves(routine) } as any,
      routinePacker: { pack: sinon.stub().resolves(packed) } as any,
      feedback: sinon.stub({ ...feedback }),
    };

    const records = new Records(services);
    const completedStub = sinon.stub(records, 'showCompleted');

    await records.debug({ bail: false }, false);

    expect(services.routineConfigs.readOrThrow.args).to.eql([[]]);
    expect(services.routinePacker.pack.args).to.eql([[]]);
    expect(services.api.routines.debug.args).to.eql([
      [
        {
          mocha: routine.mocha,
          package: 'some-pack',
          dependencies: { packageJson: { dependencies: { foo: '1.2.3' } }, shrinkwrapJson: { dependencies: { foo: '3.2.1' } } },
        },
      ],
    ]);
    expect(completedStub.args).to.eql([[{ id: 'foo-id' }, false]]);
  });
});
