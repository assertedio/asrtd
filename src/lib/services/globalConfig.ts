import Conf from 'conf';
import { DateTime } from 'luxon';

interface ServicesInterface {
  conf: Conf;
}

const KEYS = {
  DEFAULT_PROJECT: 'defaultProject',
  API_KEY: 'key',
  UPDATE_LOG_DATE: 'updateLogDate',
  UPDATE_LOG_VERSION: 'updateLogVersion',
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
   * Get update version
   *
   * @returns {string | null}
   */
  getUpdateVersion(): string | null {
    return (this.services.conf.get(KEYS.UPDATE_LOG_VERSION) as string) || null;
  }

  /**
   * Set update version
   *
   * @param {string} version
   * @returns {void}
   */
  setUpdateVersion(version: string): void {
    this.services.conf.set(KEYS.UPDATE_LOG_VERSION, version);
  }

  /**
   * Clear update version
   *
   * @returns {void}
   */
  clearUpdateVersion(): void {
    this.services.conf.delete(KEYS.UPDATE_LOG_VERSION);
  }

  /**
   * Get update log date
   *
   * @returns {DateTime | null}
   */
  getUpdateLogDate(): DateTime | null {
    const isoDate = this.services.conf.get(KEYS.UPDATE_LOG_DATE);

    if (isoDate) {
      const parsedDate = DateTime.fromISO(isoDate as string);

      if (!parsedDate.isValid) {
        this.clearUpdateLogDate();
        return null;
      }

      return parsedDate.toUTC();
    }

    return null;
  }

  /**
   * Set update log date
   *
   * @param {DateTime} date
   * @returns {void}
   */
  setUpdateLogDate(date: DateTime): void {
    if (date.isValid) {
      this.services.conf.set(KEYS.UPDATE_LOG_DATE, date.toUTC().toISO());
    }
  }

  /**
   * Clear log date
   *
   * @returns {void}
   */
  clearUpdateLogDate(): void {
    this.services.conf.delete(KEYS.UPDATE_LOG_DATE);
  }

  /**
   * Get API key from global config
   *
   * @returns {string}
   */
  getApiKey(): string | null {
    return (this.services.conf.get(KEYS.API_KEY) as string) || null;
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
