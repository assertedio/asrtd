import { RUN_STATUS } from '@asserted/models';

export interface RecordFilters {
  includeStatus: RUN_STATUS[];
  start?: Date;
  end?: Date;
}
