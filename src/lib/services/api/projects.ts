import { Project, ProjectInterface } from '@asserted/models';
import { AxiosInstance } from 'axios';

import { defaultApiError } from '../../clients/axios';

export interface ServicesInterface {
  axios: AxiosInstance;
}

/**
 * @class
 */
export class Projects {
  readonly services: ServicesInterface;

  /**
   * @param {ServicesInterface} services
   */
  constructor(services: ServicesInterface) {
    this.services = services;
  }

  /**
   * Get project by ID
   *
   * @param {string} projectId
   * @returns {Promise<ProjectInterface>}
   */
  async get(projectId: string): Promise<ProjectInterface> {
    return this.services.axios
      .get(`/projects/${projectId}`)
      .then((response: any) => new Project(response))
      .catch(defaultApiError());
  }

  /**
   * List projects for token
   *
   * @returns {ProjectInterface[]}
   */
  async list(): Promise<ProjectInterface[]> {
    return this.services.axios
      .get('/projects')
      .then(({ list }: any) => list.map((project) => Project.fromJson(project)))
      .catch(defaultApiError());
  }
}
