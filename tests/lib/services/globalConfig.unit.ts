import { expect } from 'chai';

import sinon from 'sinon';
import { DateTime } from 'luxon';
import { GlobalConfig } from '../../../src/lib/services/globalConfig';

describe('global config unit tests', () => {
  it('get update log date - empty', () => {
    const services = {
      conf: {
        get: sinon.stub().returns(undefined),
        set: sinon.stub().returns(undefined),
        delete: sinon.stub().returns(undefined),
      } as any,
    };

    const globalConfig = new GlobalConfig(services);

    const result = globalConfig.getUpdateLogDate();
    expect(result).to.eql(null);
    expect(services.conf.delete.args).to.eql([]);
  });

  it('set update log date - malformed', () => {
    const services = {
      conf: {
        get: sinon.stub().returns('not-date'),
        set: sinon.stub().returns(undefined),
        delete: sinon.stub().returns(undefined),
      } as any,
    };

    const globalConfig = new GlobalConfig(services);

    const result = globalConfig.getUpdateLogDate();
    expect(result).to.eql(null);
    expect(services.conf.delete.args).to.eql([['updateLogDate']]);
  });

  it('set update log date - iso date', () => {
    const services = {
      conf: {
        get: sinon.stub().returns('2020-01-01T00:00:00.000Z'),
        set: sinon.stub().returns(undefined),
        delete: sinon.stub().returns(undefined),
      } as any,
    };

    const globalConfig = new GlobalConfig(services);

    const result = globalConfig.getUpdateLogDate();
    expect(result).to.eql(DateTime.fromISO('2020-01-01T00:00:00.000Z').toUTC());
    expect(services.conf.delete.args).to.eql([]);
  });
});
