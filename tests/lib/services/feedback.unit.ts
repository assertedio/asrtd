import feedback from '../../../src/lib/services/feedback';

describe('show feedback types', () => {
  it('all types', () => {
    feedback.info('some info');
    feedback.note('some notes');
    feedback.success('some success');
    feedback.warn('some warn');
    feedback.error('some error');
  });

  it('all types with color', () => {
    feedback.info('some info', 'blue');
    feedback.note('some notes', 'black');
    feedback.success('some success', 'red');
    feedback.warn('some warn', 'cyan');
    feedback.error('some error', 'magenta');
  });
});
