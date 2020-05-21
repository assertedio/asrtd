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
   * @returns {Promise<void>}
   */
  async login(openBrowser: boolean, tokenStdin: boolean): Promise<void> {
    const token = tokenStdin ? (await getStdin()).trim() : await this.services.interactions.auth.login(openBrowser);
    const spinner = ora('Verifying token...').start();

    if (!(await this.services.api.auth.verifyKey(token))) {
      spinner.fail('Authentication token is invalid, please try again');
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
