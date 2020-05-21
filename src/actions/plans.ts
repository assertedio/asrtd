import autoBind from 'auto-bind';

import { Commands } from '../commands';
import { RoutineConfigs } from '../lib/services/routineConfigs';

interface ServicesInterface {
  commands: Commands;
  routineConfigs: RoutineConfigs;
}

/**
 * @class
 */
export class Plans {
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
   * @param projectId
   */
  async get(projectId: string | undefined): Promise<void> {
    await this.services.commands.plans.get(await this.getProjectId(projectId));
  }
}
