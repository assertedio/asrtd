import { AxiosInstance } from 'axios';

import logger from '../../../logger';

const log = logger('api/auth');

export interface ServicesInterface {
  axios: AxiosInstance;
}

/**
 * @class
 */
export class Auth {
  readonly services: ServicesInterface;

  /**
   * @param {ServicesInterface} services
   */
  constructor(services: ServicesInterface) {
    this.services = services;
  }

  /**
   * Verify API key
   *
   * @param {string} apiKey
   * @returns {Promise<boolean>}
   */
  async verifyKey(apiKey): Promise<boolean> {
    return this.services.axios
      .get('/user', { headers: { Authorization: `Bearer ${apiKey}` } })
      .then(() => {
        log('Key verified');
        return true;
      })
      .catch((error) => {
        log(`Key verification failed with status: ${error?.code}`);
        log(`Response: ${error?.message}`);

        return false;
      });
  }
}
