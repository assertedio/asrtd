import autoBind from 'auto-bind';

import { Commands } from '../commands';

interface ServicesInterface {
  commands: Commands;
}

/**
 * @class
 */
export class Auth {
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
   * @param {any} options
   */
  async login(options): Promise<void> {
    const { open, tokenStdin } = options.opts();
    await this.services.commands.auth.login(open, tokenStdin);
  }

  /**
   */
  async logout(): Promise<void> {
    await this.services.commands.auth.logout();
  }
}
