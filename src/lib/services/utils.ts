import { OVERALL_ROUTINE_STATUS, ROUTINE_CONFIG_STATUS, RUN_STATUS, TEST_RESULT_STATUS, TIMELINE_EVENT_STATUS } from '@asserted/models';
import { ForegroundColor } from 'chalk';
import humanizeDuration from 'humanize-duration';
import path from 'path';

import { ROUTINE_DIRNAME } from '../constants';

export const getAssertedDir = (cwd = process.cwd()): string => {
  return path.basename(cwd) === ROUTINE_DIRNAME ? cwd : path.join(cwd, ROUTINE_DIRNAME);
};

export const shortHumanizer = humanizeDuration.humanizer({
  language: 'shortEn',
  languages: {
    shortEn: {
      y: (): string => 'yr',
      mo: (): string => 'mo',
      w: (): string => 'wk',
      d: (): string => 'day',
      h: (): string => 'hr',
      m: (): string => 'min',
      s: (): string => 'sec',
      ms: (): string => 'ms',
    },
  },
});

export const getColorOfStatus = (
  status: TIMELINE_EVENT_STATUS | RUN_STATUS | TEST_RESULT_STATUS | OVERALL_ROUTINE_STATUS | null
): typeof ForegroundColor => {
  switch (status) {
    case TIMELINE_EVENT_STATUS.UP:
    case TEST_RESULT_STATUS.PASSED:
    case RUN_STATUS.PASSED:
    case ROUTINE_CONFIG_STATUS.ACTIVE:
      return 'green';
    case TIMELINE_EVENT_STATUS.IMPAIRED:
    case RUN_STATUS.CREATED:
      return 'yellow';
    case TIMELINE_EVENT_STATUS.DOWN:
    case TEST_RESULT_STATUS.FAILED:
    case RUN_STATUS.FAILED:
      return 'red';
    case TEST_RESULT_STATUS.PENDING:
    case TIMELINE_EVENT_STATUS.TIMEOUT:
    case TIMELINE_EVENT_STATUS.UNKNOWN:
    case ROUTINE_CONFIG_STATUS.NO_RECORDS:
    case ROUTINE_CONFIG_STATUS.NOT_PUSHED:
    case ROUTINE_CONFIG_STATUS.DISABLED:
    default:
      return 'blue';
  }
};
