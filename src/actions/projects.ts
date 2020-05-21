import autoBind from 'auto-bind';

import { Commands } from '../commands';

interface ServicesInterface {
  commands: Commands;
}

/**
 * @class
 */
export class Projects {
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
   */
  async list(): Promise<void> {
    await this.services.commands.projects.list();
  }
}
