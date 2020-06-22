import { AxiosInstance } from 'axios';
import semver from 'semver';
import chalk from 'chalk';
import terminalLink from 'terminal-link';
import { DateTime } from 'luxon';
import { GlobalConfig } from './globalConfig';
import { FeedbackInterface } from './feedback';
import logger from '../../logger';

import { homepage } from '../../../package.json';

const log = logger('updater');

interface ServicesInterface {
  axios: AxiosInstance;
  globalConfig: GlobalConfig;
  feedback: FeedbackInterface;
}

interface ConfigInterface {
  currentVersion: string;
}

/**
 * @class
 */
export class Updater {
  static CONSTANTS = {
    UPDATE_FREQ_DAYS: 1,
  };

  readonly services: ServicesInterface;

  readonly config: ConfigInterface;

  /**
   * @param {ServicesInterface} services
   * @param {ConfigInterface} config
   */
  constructor(services: ServicesInterface, config: ConfigInterface) {
    this.services = services;
    this.config = config;
  }

  /**
   * Get latest version from registry
   *
   * @returns {Promise<string | null>}
   */
  async getVersion(): Promise<string | null> {
    try {
      const registryEntry = (await this.services.axios.get('https://registry.npmjs.org/asrtd', { timeout: 200 })).data;

      if (!registryEntry || !registryEntry?.['dist-tags'].latest) {
        log('Empty response from npm registry');
        return null;
      }

      const { latest } = registryEntry?.['dist-tags'];
      return latest || null;
    } catch (error) {
      log(`Error during update check: ${error.message}`);
      return null;
    }
  }

  /**
   * Get update message, and debounce it if requested
   *
   * @param {boolean} debounce
   * @param {DateTime} curDate
   * @returns {Promise<string | null>}
   */
  async getUpdateMessage(debounce: boolean, curDate = DateTime.utc()): Promise<string | null> {
    const latest = await this.getVersion();
    if (!latest) return null;
    const diff = semver.diff(latest, this.config.currentVersion);
    if (!diff) return null;

    if (debounce) {
      const prevLatest = this.services.globalConfig.getUpdateVersion();
      const prevDate = this.services.globalConfig.getUpdateLogDate();

      if (prevDate && prevDate?.diff(curDate).as('days') < Updater.CONSTANTS.UPDATE_FREQ_DAYS && prevLatest === latest) {
        log('Already logged this version within this time period, skipping...');
        return null;
      }

      this.services.globalConfig.setUpdateVersion(latest);
      this.services.globalConfig.setUpdateLogDate(curDate);
    }

    // eslint-disable-next-line sonarjs/no-small-switch
    switch (diff) {
      case 'major': {
        return `${chalk.yellow('major')} update available. Visit: ${chalk.blue(terminalLink(homepage, homepage))} for changes. Run: ${chalk.grey(
          'npm i -g asrtd'
        )} to update.`;
      }
      default: {
        return `${chalk.green(diff)} update available. Run: ${chalk.green('npm i -g asrtd')} to update.`;
      }
    }
  }

  /**
   * Check for updates and log message if appropriate
   *
   * @returns {void}
   */
  async check(): Promise<void> {
    const message = await this.getUpdateMessage(true);

    if (message) {
      this.services.feedback.info(message);
      this.services.feedback.note('');
    }
  }
}
