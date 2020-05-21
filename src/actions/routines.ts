import autoBind from 'auto-bind';
import { isBoolean } from 'lodash';

import { Commands } from '../commands';
import { FeedbackInterface } from '../lib/services/feedback';
import { RoutineConfigs } from '../lib/services/routineConfigs';

interface ServicesInterface {
  commands: Commands;
  feedback: FeedbackInterface;
  routineConfigs: RoutineConfigs;
}

/**
 * @class
 */
export class Routines {
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
   * @param {any} options
   */
  async init(options): Promise<void> {
    await this.services.commands.routines.initialize(options.opts());
  }

  /**
   * @param {any} options
   */
  async list(options): Promise<void> {
    const { project } = options.opts();
    await this.services.commands.routines.list(await this.getProjectId(project));
  }

  /**
   * @param {string} routineId
   * @param {any} options
   */
  async remove(routineId: string | undefined, options): Promise<void> {
    const { force } = options.opts();
    await this.services.commands.routines.remove(await this.getRoutineId(routineId), force);
  }

  /**
   * @param {string} routineId
   */
  async enable(routineId: string | undefined): Promise<void> {
    await this.services.commands.routines.enable(await this.getRoutineId(routineId));
  }

  /**
   * @param {string} routineId
   */
  async disable(routineId: string | undefined): Promise<void> {
    await this.services.commands.routines.disable(await this.getRoutineId(routineId));
  }

  /**
   * @param {any} options
   */
  async run(options): Promise<void> {
    const { online, pushed } = options.opts();

    if (pushed && online) {
      throw new Error('Cannot provide --online and --pushed at the same time');
    }

    if (pushed) {
      await this.services.commands.results.runImmediate(!isBoolean(pushed) ? pushed : undefined);
    } else if (online) {
      await this.services.commands.results.debug(options.opts());
    } else {
      await this.services.commands.results.local(options.opts());
    }
  }

  /**
   */
  async push(): Promise<void> {
    await this.services.commands.routines.push();
  }
}
