import Conf from 'conf';

interface ServicesInterface {
  conf: Conf;
}

const KEYS = {
  DEFAULT_PROJECT: 'defaultProject',
  API_KEY: 'key',
};

/**
 * @class
 */
export class GlobalConfig {
  private readonly services: ServicesInterface;

  /**
   * @param {ServicesInterface} services
   */
  constructor(services: ServicesInterface) {
    this.services = services;
  }

  /**
   * Get API key from global config
   *
   * @returns {string}
   */
  getApiKey(): string | null {
    return this.services.conf.get(KEYS.API_KEY) || null;
  }

  /**
   * Set API key in global config
   *
   * @param {string} apiKey
   * @returns {void}
   */
  setApiKey(apiKey: string): void {
    this.services.conf.set(KEYS.API_KEY, apiKey);
  }

  /**
   * Remove api key from config
   *
   * @returns {void}
   */
  clearApiKey(): void {
    this.services.conf.delete(KEYS.API_KEY);
  }
}
