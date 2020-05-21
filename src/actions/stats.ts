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
export class Stats {
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
   * If project ID is not provided, attempt to pull from routine config
   *
   * @param projectId
   * @returns {Promise<string | undefined>}
   * @private
   */
  private async getProjectId(projectId?: string): Promise<string | undefined> {
    return projectId || this.services.routineConfigs.getProjectId();
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
  async status(routineId: string | undefined, options): Promise<void> {
    const { project, all } = options.opts();
    await this.services.commands.stats.status(all, await this.getProjectId(project), await this.getRoutineId(routineId));
  }

  /**
   * @param {string} routineId
   * @param {any} options
   */
  async timeline(routineId: string | undefined, options): Promise<void> {
    const { start = DateTime.utc().minus({ day: 1 }).toJSDate(), end, nextAfter, prevBefore, limit } = options.opts();

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

    await this.services.commands.stats.timeline(search, await this.getRoutineId(routineId));
  }
}
