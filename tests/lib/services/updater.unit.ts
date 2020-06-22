import { expect } from 'chai';
import sinon from 'sinon';
import chalk from 'chalk';
import { DateTime } from 'luxon';
import { Updater } from '../../../src/lib/services/updater';

describe('updater unit tests', () => {
  before(() => {
    chalk.level = 3;
  });

  it('get version', async () => {
    const services = {
      axios: {
        get: sinon.stub().resolves({
          data: {
            'dist-tags': {
              latest: '1.2.3',
            },
          },
        }),
      } as any,
      globalConfig: {} as any,
      feedback: {} as any,
    };

    const config = {} as any;

    const updater = new Updater(services, config);

    expect(await updater.getVersion()).to.eql('1.2.3');
    expect(services.axios.get.args).to.eql([['https://registry.npmjs.org/asrtd', { timeout: 200 }]]);
  });

  it('get version - version missing', async () => {
    const services = {
      axios: {
        get: sinon.stub().resolves({
          data: {},
        }),
      } as any,
      globalConfig: {} as any,
      feedback: {} as any,
    };

    const config = {} as any;

    const updater = new Updater(services, config);

    expect(await updater.getVersion()).to.eql(null);
  });

  it('get version - bad request', async () => {
    const services = {
      axios: {
        get: sinon.stub().rejects(new Error('boom')),
      } as any,
      globalConfig: {} as any,
      feedback: {} as any,
    };

    const config = {} as any;

    const updater = new Updater(services, config);

    expect(await updater.getVersion()).to.eql(null);
  });

  it('get update message - minor', async () => {
    const services = {
      axios: {} as any,
      globalConfig: {
        getUpdateVersion: sinon.stub().returns(null),
        getUpdateLogDate: sinon.stub().returns(null),
        setUpdateVersion: sinon.stub().returns(null),
        setUpdateLogDate: sinon.stub().returns(null),
      } as any,
      feedback: {} as any,
    };

    const config = {
      currentVersion: '1.2.3',
    } as any;

    const updater = new Updater(services, config);
    const getStub = sinon.stub(updater, 'getVersion').resolves('1.3.4');

    const message = await updater.getUpdateMessage(true);
    expect(getStub.callCount).to.eql(1);
    expect(message).to.eql('\u001B[32mminor\u001B[39m update available. Run: \u001B[32mnpm i -g asrtd\u001B[39m to update.');
  });

  it('get update message - major', async () => {
    const services = {
      axios: {} as any,
      globalConfig: {
        getUpdateVersion: sinon.stub().returns(null),
        getUpdateLogDate: sinon.stub().returns(null),
        setUpdateVersion: sinon.stub().returns(null),
        setUpdateLogDate: sinon.stub().returns(null),
      } as any,
      feedback: {} as any,
    };

    const config = {
      currentVersion: '1.2.3',
    } as any;

    const updater = new Updater(services, config);
    const getStub = sinon.stub(updater, 'getVersion').resolves('3.3.4');

    const message = await updater.getUpdateMessage(true);
    expect(getStub.callCount).to.eql(1);
    expect(message).to.eql(
      '\u001B[33mmajor\u001B[39m update available. Visit: \u001B[34m\u001B]8;;https://github.com/asserted/asrtd#readme\u0007https://github.com/asserted/asrtd#readme\u001B]8;;\u0007\u001B[39m for changes. Run: \u001B[90mnpm i -g asrtd\u001B[39m to update.'
    );
  });

  it('get update message - dont debounce w no date', async () => {
    const services = {
      axios: {} as any,
      globalConfig: {
        getUpdateVersion: sinon.stub().returns('1.3.4'),
        getUpdateLogDate: sinon.stub().returns(null),
        setUpdateVersion: sinon.stub().returns(null),
        setUpdateLogDate: sinon.stub().returns(null),
      } as any,
      feedback: {} as any,
    };

    const config = {
      currentVersion: '1.2.3',
    } as any;

    const updater = new Updater(services, config);
    const getStub = sinon.stub(updater, 'getVersion').resolves('1.3.4');

    const message = await updater.getUpdateMessage(true);
    expect(getStub.callCount).to.eql(1);
    expect(message).to.eql('\u001B[32mminor\u001B[39m update available. Run: \u001B[32mnpm i -g asrtd\u001B[39m to update.');
  });

  it('get update message - debounce', async () => {
    const curDate = DateTime.fromISO('2020-01-01T00:00:00.000Z');

    const services = {
      axios: {} as any,
      globalConfig: {
        getUpdateVersion: sinon.stub().returns('1.3.4'),
        getUpdateLogDate: sinon.stub().returns(curDate),
        setUpdateVersion: sinon.stub().returns(null),
        setUpdateLogDate: sinon.stub().returns(null),
      } as any,
      feedback: {} as any,
    };

    const config = {
      currentVersion: '1.2.3',
    } as any;

    const updater = new Updater(services, config);
    const getStub = sinon.stub(updater, 'getVersion').resolves('1.3.4');

    const message = await updater.getUpdateMessage(true, curDate);
    expect(getStub.callCount).to.eql(1);
    expect(message).to.eql(null);
  });
});
