import { INTERVAL_UNITS } from '@asserted/models';

export interface InitRoutineInterface {
  name?: string;
  description?: string;
  intervalUnit?: INTERVAL_UNITS;
  intervalValue?: number;
}

export interface InitParametersInterface extends InitRoutineInterface {
  examples: boolean;
  install: boolean;
  projectId?: string;
}
