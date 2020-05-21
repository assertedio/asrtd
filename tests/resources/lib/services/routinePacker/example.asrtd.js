const { expect } = require('chai');
const axios = require('axios');
const HTTP_STATUS = require('http-status');

describe('example tests', () => {
  it('get endpoint returns 200', async () => {
    const { status } = await axios.get('https://postman-echo.com/get?foo1=bar1&foo2=bar2', { validateStatus: () => true });
    expect(status).to.eql(HTTP_STATUS.OK);
  });

  it('get endpoint returns 200 and body', async () => {
    const { status, data } = await axios.get('https://postman-echo.com/get?foo1=bar1&foo2=bar2', { validateStatus: () => true });
    expect(status).to.eql(HTTP_STATUS.OK);
    expect(data.args).to.eql({ foo1: 'bar1', foo2: 'bar2' });
  });

  it('post endpoint returns 200 and body', async () => {
    const { status, data } = await axios.post('https://postman-echo.com/post', { foo: 'bar' }, { validateStatus: () => true });
    expect(status).to.eql(HTTP_STATUS.OK);
    expect(data.json).to.eql({ foo: 'bar' });
  });
});
