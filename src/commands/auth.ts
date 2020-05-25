import getStdin from 'get-stdin';
import ora from 'ora';

import { Interactions } from '../interactions';
import { Api } from '../lib/services/api';
import { FeedbackInterface } from '../lib/services/feedback';
import { GlobalConfig } from '../lib/services/globalConfig';

export interface ServicesInterface {
  globalConfig: GlobalConfig;
  api: Api;
  interactions: Interactions;
  feedback: FeedbackInterface;
}

/**
 * @class
 */
export class Auth {
  private readonly services: ServicesInterface;

  /**
   * @param {ServicesInterface} services
   */
  constructor(services: ServicesInterface) {
    this.services = services;
  }

  /**
   * Log in and store api key
   *
   * @param {boolean} openBrowser
   * @param {boolean} tokenStdin
   * @param {boolean} hidden
   * @returns {Promise<void>}
   */
  async login(openBrowser: boolean, tokenStdin: boolean, hidden: boolean): Promise<void> {
    const token = tokenStdin ? (await getStdin()).trim() : await this.services.interactions.auth.login(openBrowser, hidden);

    // eslint-disable-next-line no-magic-numbers
    if (token.trim().length <= 2) {
      throw new Error(`Token too short: ${token.trim().length} characters`);
    }

    const spinner = ora('Verifying token...').start();

    if (!(await this.services.api.auth.verifyKey(token))) {
      spinner.fail("Authentication token is invalid, please try again. You can use 'asrtd login --no-hidden' to show the token as it's entered.");
      throw new Error('Could not verify token');
    }

    this.services.globalConfig.setApiKey(token);
    spinner.succeed('Token verified and saved');
  }

  /**
   * Remove API key
   *
   * @returns {void}
   */
  async logout(): Promise<void> {
    this.services.globalConfig.clearApiKey();
    this.services.feedback.success('Removed authentication token');
  }
}
