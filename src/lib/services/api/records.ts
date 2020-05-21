import { CompletedRunRecord, ListResponse, Search } from '@asserted/models';
import { AxiosInstance } from 'axios';

import { defaultApiError } from '../../clients/axios';

export interface ServicesInterface {
  axios: AxiosInstance;
}

/**
 * @class
 */
export class Records {
  private readonly services: ServicesInterface;

  /**
   * @param {ServicesInterface} services
   */
  constructor(services: ServicesInterface) {
    this.services = services;
  }

  /**
   * Get stats on routine
   *
   * @param {string} routineId
   * @param {Search} search
   * @returns {Promise<any>}
   */
  async search(routineId: string, search: Search): Promise<ListResponse<CompletedRunRecord>> {
    return this.services.axios
      .post(`/routines/${routineId}/records`, search)
      .then((response: any) => new ListResponse(response, CompletedRunRecord))
      .catch(defaultApiError());
  }

  /**
   * Get stats on routine
   *
   * @param {string} routineId
   * @param {string} recordId
   * @returns {Promise<any>}
   */
  async get(routineId: string, recordId: string): Promise<CompletedRunRecord> {
    return this.services.axios
      .get(`/routines/${routineId}/records/${recordId}`)
      .then((response: any) => new CompletedRunRecord(response))
      .catch(defaultApiError());
  }
}
