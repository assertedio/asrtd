const { expect } = require('chai');
const axios = require('axios');
const HTTP_STATUS = require('http-status');

describe('simple tests', () => {
  it('get endpoint returns 200', async () => {
    // Having 'validateStatus' return true in axios ensures that it doesn't throw for non-200 responses.
    // This allows the status to be asserted directly using expect regardless of it's value
    const { status } = await axios.get('https://api.asserted.io/v1/echo', { validateStatus: () => true });
    expect(status).to.eql(HTTP_STATUS.OK);
  });

  it('post endpoint returns 200 and body', async () => {
    const { status, data } = await axios.post('https://api.asserted.io/v1/echo', { foo1: 'bar1', foo2: 'bar2' },  { validateStatus: () => true });
    expect(status).to.eql(HTTP_STATUS.OK);
    expect(data.body).to.eql({ foo1: 'bar1', foo2: 'bar2' });
  });

  it('delete endpoint returns 200 and no body', async () => {
    const { status, data } = await axios.delete('https://api.asserted.io/v1/echo',  { validateStatus: () => true });
    expect(status).to.eql(HTTP_STATUS.OK);
    expect(data.body).to.eql({});
  });
});
