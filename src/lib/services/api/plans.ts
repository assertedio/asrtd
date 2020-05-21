import { PlanInterface, ProjectPlan, UsageAndLimitInterface } from '@asserted/models';
import { AxiosInstance } from 'axios';

import { defaultApiError } from '../../clients/axios';

export interface ServicesInterface {
  axios: AxiosInstance;
}

/**
 * @class
 */
export class Plans {
  readonly services: ServicesInterface;

  /**
   * @param {ServicesInterface} services
   */
  constructor(services: ServicesInterface) {
    this.services = services;
  }

  /**
   * Get project plan
   *
   * @param {string} projectId
   * @returns {Promise<ProjectPlan>}
   */
  async get(projectId: string): Promise<ProjectPlan> {
    return this.services.axios
      .get(`/projects/${projectId}/billing`)
      .then((response: any) => new ProjectPlan(response))
      .catch(defaultApiError());
  }

  /**
   * List plans
   *
   * @returns {Promise<PlanInterface[]>}
   */
  async listPlans(): Promise<PlanInterface[]> {
    return this.services.axios
      .get('/plans')
      .then(({ list }: any) => list)
      .catch(defaultApiError());
  }

  /**
   * Get usage
   *
   * @param {string} projectId
   * @returns {Promise<UsageAndLimitInterface>}
   */
  async getUsage(projectId: string): Promise<UsageAndLimitInterface> {
    return this.services.axios
      .get(`/projects/${projectId}/usage`)
      .then((response: any) => response as UsageAndLimitInterface)
      .catch(defaultApiError());
  }
}
