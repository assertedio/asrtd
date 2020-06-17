const { expect } = require('chai');
const axios = require('axios');
const HTTP_STATUS = require('http-status');
const sslChecker = require('ssl-checker');

describe('ssl tests', () => {
  it('ssl status', async () => {
    const { daysRemaining, valid } = await sslChecker('api.asserted.io');

    expect(valid).to.eql(true);
    expect(daysRemaining).to.be.at.least(7);
  });
});
