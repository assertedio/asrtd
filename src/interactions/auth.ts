import inquirer from 'inquirer';
import open from 'open';
import terminalLink from 'terminal-link';

import { Api } from '../lib/services/api';
import { FeedbackInterface } from '../lib/services/feedback';
import { GlobalConfig } from '../lib/services/globalConfig';
import logger from '../logger';

const log = logger('auth');

export interface ServicesInterface {
  globalConfig: GlobalConfig;
  feedback: FeedbackInterface;
  api: Api;
}

export interface ConfigInterface {
  appHost: string;
}

/**
 * @class
 */
export class Auth {
  private readonly services: ServicesInterface;

  private readonly config: ConfigInterface;

  /**
   * @param {ServicesInterface} services
   * @param {ConfigInterface} config
   */
  constructor(services: ServicesInterface, config: ConfigInterface) {
    this.services = services;
    this.config = config;
  }

  /**
   * Take token from prompt
   *
   * @param {boolean} openBrowser
   * @param {boolean} hidden
   * @returns {string}
   */
  async login(openBrowser: boolean, hidden: boolean): Promise<string> {
    const registerUrl = new URL(`${this.config.appHost}/tokens`).toString();
    this.services.feedback.info(terminalLink(`Login here and create a token: ${registerUrl}`, registerUrl), 'blueBright');

    if (openBrowser) {
      await open(registerUrl);
    }

    if (process.platform === 'win32') {
      log('Cannot use hidden input on windows');
      hidden = false;
    }

    const loginResponse = await inquirer.prompt([
      {
        type: hidden ? 'password' : 'input',
        name: 'token',
        message: 'Paste token here',
      },
    ]);

    return loginResponse.token.trim();
  }

  /**
   * Ensure that auth exists
   *
   * @returns {Promise<void>}
   */
  async ensureAuth(): Promise<void> {
    if (!this.services.globalConfig.getApiKey()) {
      throw new Error('Authentication token not found. Please run: `asrtd login`');
    }
    log('auth token found');
    await this.services.api.auth.verifyKey(this.services.globalConfig.getApiKey());
  }
}
