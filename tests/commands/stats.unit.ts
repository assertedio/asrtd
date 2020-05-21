import { expect } from 'chai';
import sinon from 'sinon';

import { Stats } from '../../src/commands/stats';
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

describe('results unit tests', () => {
  beforeEach(() => sinon.restore());

  it('timeline without routine', async () => {
    const services = {
      ...defaultServices,
      interactions: {
        routines: {
          selectRoutine: sinon.stub().resolves({ id: 'selected-routine-id' }),
        },
      } as any,
      api: {
        stats: {
          timelineEvents: sinon.stub().resolves({ list: [{ id: 'some-event' }], prevBefore: curDate, nextAfter: curDate }),
        },
      } as any,
      feedback: sinon.stub({ ...feedback }),
    };

    sinon.stub(Stats, 'getTimeline').returns([['foo']]);
    const results = new Stats(services);

    await results.timeline({ searchThing: true } as any);

    expect((Stats.getTimeline as any).args).to.eql([[[{ id: 'some-event' }]]]);
    expect(services.feedback.noIdent.callCount).to.eql(1);
    expect(services.feedback.note.callCount).to.eql(2);
    expect(services.interactions.routines.selectRoutine.callCount).to.eql(1);
    expect(services.api.stats.timelineEvents.args).to.eql([['selected-routine-id', { searchThing: true }]]);
  });

  it('timeline with routine', async () => {
    const services = {
      ...defaultServices,
      interactions: {
        routines: {
          selectRoutine: sinon.stub().resolves({ id: 'selected-routine-id' }),
        },
      } as any,
      api: {
        stats: {
          timelineEvents: sinon.stub().resolves({ list: [{ id: 'some-event' }], prevBefore: curDate, nextAfter: curDate }),
        },
      } as any,
      feedback: sinon.stub({ ...feedback }),
    };

    sinon.stub(Stats, 'getTimeline').returns([['foo']]);
    const results = new Stats(services);

    await results.timeline({ searchThing: true } as any, 'routine-id');

    expect((Stats.getTimeline as any).args).to.eql([[[{ id: 'some-event' }]]]);
    expect(services.feedback.noIdent.callCount).to.eql(1);
    expect(services.feedback.note.callCount).to.eql(2);
    expect(services.interactions.routines.selectRoutine.callCount).to.eql(0);
    expect(services.api.stats.timelineEvents.args).to.eql([['routine-id', { searchThing: true }]]);
  });

  it('timeline with single page', async () => {
    const services = {
      ...defaultServices,
      interactions: {
        routines: {
          selectRoutine: sinon.stub().resolves({ id: 'selected-routine-id' }),
        },
      } as any,
      api: {
        stats: {
          timelineEvents: sinon.stub().resolves({ list: [{ id: 'some-event' }], prevBefore: undefined, nextAfter: undefined }),
        },
      } as any,
      feedback: sinon.stub({ ...feedback }),
    };

    sinon.stub(Stats, 'getTimeline').returns([['foo']]);
    const results = new Stats(services);

    await results.timeline({ searchThing: true } as any, 'routine-id');

    expect((Stats.getTimeline as any).args).to.eql([[[{ id: 'some-event' }]]]);
    expect(services.feedback.noIdent.callCount).to.eql(1);
    expect(services.feedback.note.callCount).to.eql(0);
    expect(services.interactions.routines.selectRoutine.callCount).to.eql(0);
    expect(services.api.stats.timelineEvents.args).to.eql([['routine-id', { searchThing: true }]]);
  });
});
