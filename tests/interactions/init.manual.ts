import { expect } from 'chai';

import { Init, OVERWRITE_ROUTINE } from '../../src/interactions/init';
import { instruct } from './utils';

describe('init manual prompt tests', function () {
  this.timeout(0);

  it('default answers', async () => {
    const init = new Init({}, { assertedDir: 'some-dir' });

    instruct('just defaults');
    const result = await init.getInitParameters({});

    expect(result).to.eql({
      name: '@asserted/cli',
      description: '',
      intervalUnit: 'min',
      intervalValue: 5,
    });
  });

  it('manual answers', async () => {
    const init = new Init({}, { assertedDir: 'some-dir' });

    instruct('manual answers: other, desc, hr, 1');
    const result = await init.getInitParameters({});

    expect(result).to.eql({
      name: 'other',
      description: 'desc',
      intervalUnit: 'hr',
      intervalValue: 1,
    });
  });

  it('skip when all values are provided', async () => {
    const init = new Init({}, { assertedDir: 'some-dir' });

    // Should be no prompting
    const result = await init.getInitParameters({
      name: 'other',
      description: 'desc',
      intervalUnit: 'hr' as any,
      intervalValue: 1,
    });

    expect(result).to.eql({
      name: 'other',
      description: 'desc',
      intervalUnit: 'hr',
      intervalValue: 1,
    });
  });

  it('default answers with provided defaults', async () => {
    const init = new Init({}, { assertedDir: 'some-dir' });

    instruct('just defaults');
    const result = await init.getInitParameters(
      {},
      {
        name: 'other',
        description: 'desc',
        intervalUnit: 'hr' as any,
        intervalValue: 1,
      }
    );

    expect(result).to.eql({
      name: 'other',
      description: 'desc',
      intervalUnit: 'hr',
      intervalValue: 1,
    });
  });

  it('confirm overwrite', async () => {
    const init = new Init({}, { assertedDir: 'some-dir' });

    instruct('select overwrite');
    const result = await init.confirmOverwrite();

    expect(result).to.eql(OVERWRITE_ROUTINE.OVERWRITE);
  });
});
