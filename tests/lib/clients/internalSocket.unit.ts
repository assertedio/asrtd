import { expect } from 'chai';
import sinon from 'sinon';
import { InternalSocket } from '../../../src/lib/clients/internalSocket';

const defaultServices = {
  globalConfig: {} as any,
};

describe('internal socket unit tests', () => {
  it('wait for record - record id set before wait', async () => {
    const services = { ...defaultServices };

    const internalSocket = new InternalSocket(services, { apiHost: 'api-host' });

    internalSocket.socket = {
      removeListener: sinon.stub().resolves(),
      on: sinon.stub().resolves(),
    } as any;

    internalSocket.addRecordId('record-id');
    const { wait } = internalSocket.waitForRecord();

    expect((internalSocket.socket as any).on.callCount).to.eql(1);
    expect((internalSocket.socket as any).removeListener.callCount).to.eql(0);

    (internalSocket.socket as any).on.args[0][1]({ id: 'record-id', routineId: 'rout-id' });

    expect(await wait).to.eql({ id: 'record-id', routineId: 'rout-id' });
    expect((internalSocket.socket as any).removeListener.callCount).to.eql(1);
  });

  it('wait for record - record id set after wait', async () => {
    const services = { ...defaultServices };

    const internalSocket = new InternalSocket(services, { apiHost: 'api-host' });

    internalSocket.socket = {
      removeListener: sinon.stub().resolves(),
      on: sinon.stub().resolves(),
    } as any;

    const { wait } = internalSocket.waitForRecord();

    expect((internalSocket.socket as any).on.callCount).to.eql(1);
    expect((internalSocket.socket as any).removeListener.callCount).to.eql(0);

    (internalSocket.socket as any).on.args[0][1]({ id: 'record-id', routineId: 'rout-id' });
    internalSocket.addRecordId('record-id');

    expect(await wait).to.eql({ id: 'record-id', routineId: 'rout-id' });
    expect((internalSocket.socket as any).removeListener.callCount).to.eql(1);
  });

  it('wait for build - build id set before wait', async () => {
    const services = { ...defaultServices };

    const internalSocket = new InternalSocket(services, { apiHost: 'api-host' });

    internalSocket.socket = {
      removeListener: sinon.stub().resolves(),
      on: sinon.stub().resolves(),
    } as any;

    internalSocket.addBuildId('build-id');
    const { wait } = internalSocket.waitForBuild();

    expect((internalSocket.socket as any).on.callCount).to.eql(1);
    expect((internalSocket.socket as any).removeListener.callCount).to.eql(0);

    (internalSocket.socket as any).on.args[0][1]({ id: 'build-id', console: 'console-string' });

    expect(await wait).to.eql('console-string');
    expect((internalSocket.socket as any).removeListener.callCount).to.eql(1);
  });

  it('wait for build - build id set after wait', async () => {
    const services = { ...defaultServices };

    const internalSocket = new InternalSocket(services, { apiHost: 'api-host' });

    internalSocket.socket = {
      removeListener: sinon.stub().resolves(),
      on: sinon.stub().resolves(),
    } as any;

    const { wait } = internalSocket.waitForBuild();

    expect((internalSocket.socket as any).on.callCount).to.eql(1);
    expect((internalSocket.socket as any).removeListener.callCount).to.eql(0);

    (internalSocket.socket as any).on.args[0][1]({ id: 'build-id', console: 'console-string' });
    internalSocket.addBuildId('build-id');

    expect(await wait).to.eql('console-string');
    expect((internalSocket.socket as any).removeListener.callCount).to.eql(1);
  });
});
