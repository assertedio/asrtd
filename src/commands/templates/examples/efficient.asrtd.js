const { expect } = require('chai');
const axios = require('axios');
const HTTP_STATUS = require('http-status');

describe('time-efficient tests', () => {
  let results;

  // Rather than making each discrete request inside inside an individual test case, it can be more efficient
  // to make all the requests at once, in parallel, in the 'before' hook, and then assert the results.
  before(async () => {
    const requests = [
      axios.get('https://api.asserted.io/v1/echo', { validateStatus: () => true }),
      axios.post('https://api.asserted.io/v1/echo', { foo1: 'bar1', foo2: 'bar2' },  { validateStatus: () => true }),
      axios.delete('https://api.asserted.io/v1/echo', { validateStatus: () => true }),
    ];

    // By using Promise.all and not using 'await' inside the all, the requests will essentially all execute in parallel
    // There is a limit to how many parallel requests Node will make at once
    results = await Promise.all(requests);

    // If you want to control concurrency, use Bluebird.map instead of Promise.all, and set the concurrency option
    // Docs: http://bluebirdjs.com/docs/api/promise.map.html
  });

  it('get endpoint returns 200', () => {
    const { status } = results[0];
    expect(status).to.eql(HTTP_STATUS.OK);
  });

  it('post endpoint returns 200 and body', () => {
    const { status, data } = results[1];
    expect(status).to.eql(HTTP_STATUS.OK);
    expect(data.body).to.eql({ foo1: 'bar1', foo2: 'bar2' });
  });

  it('delete endpoint returns 200', () => {
    const { status, data } = results[2];
    expect(status).to.eql(HTTP_STATUS.OK);
    expect(data.body).to.eql({});
  });
});
