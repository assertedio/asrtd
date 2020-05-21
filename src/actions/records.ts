import { Search } from '@asserted/models';
import autoBind from 'auto-bind';
import { DateTime } from 'luxon';

import { Commands } from '../commands';
import { RoutineConfigs } from '../lib/services/routineConfigs';

interface ServicesInterface {
  commands: Commands;
  routineConfigs: RoutineConfigs;
}

/**
 * @class
 */
export class Records {
  readonly services: ServicesInterface;

  /**
   * @param {ServicesInterface} services
   * @param {boolean} [doAutoBind=true]
   */
  constructor(services: ServicesInterface, doAutoBind = true) {
    this.services = services;

    if (doAutoBind) {
      autoBind(this);
    }
  }

  /**
   * If routine ID is not provided, attempt to pull from routine config
   *
   * @param routineId
   * @returns {Promise<string | undefined>}
   * @private
   */
  private async getRoutineId(routineId?: string): Promise<string | undefined> {
    return routineId || this.services.routineConfigs.getRoutineId();
  }

  /**
   * @param {string} routineId
   * @param {any} options
   */
  async list(routineId: string | undefined, options): Promise<void> {
    const { showPasses = true, start = DateTime.utc().minus({ day: 1 }).toJSDate(), end, nextAfter, prevBefore, limit } = options.opts();

    const search = new Search({
      filter: {
        start,
        end,
      },
      pagination: {
        before: prevBefore,
        after: nextAfter,
        limit,
      },
    });

    await this.services.commands.results.records(showPasses, search, await this.getRoutineId(routineId));
  }

  /**
   * @param {string} recordId
   * @param {any} options
   */
  async get(recordId: string, options): Promise<void> {
    const { routineId } = options.opts();
    const { excludeHooks } = options.opts();
    await this.services.commands.results.record(recordId, excludeHooks, await this.getRoutineId(routineId));
  }
}
