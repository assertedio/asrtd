import { expect } from 'chai';
import path from 'path';

import { getAssertedDir } from '../../../src/lib/services/utils';

const RESOURCE_DIR = path.join(__dirname, '../../resources/lib/services/utils');

const cwd = process.cwd();

describe('utils unit tests', () => {
  it('get asserted dir', () => {
    expect(getAssertedDir(path.join(RESOURCE_DIR, 'foo', '.asserted').replace(cwd, ''))).to.eql('/tests/resources/lib/services/utils/foo/.asserted');
    expect(getAssertedDir(path.join(RESOURCE_DIR, 'foo').replace(cwd, ''))).to.eql('/tests/resources/lib/services/utils/foo/.asserted');
    expect(getAssertedDir(path.join(RESOURCE_DIR).replace(cwd, ''))).to.eql('/tests/resources/lib/services/utils/.asserted');
  });
});
