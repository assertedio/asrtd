import { CompletedRunRecord, CreateRoutineInterface, CreateRun, Routine, UpdateRoutineInterface } from '@asserted/models';
import { AxiosInstance } from 'axios';
import HTTP_STATUS from 'http-status';

import { ApiErrorResponseInterface, defaultApiError, isErrorResponse } from '../../clients/axios';
import { FeedbackInterface } from '../feedback';

export interface ServicesInterface {
  axios: AxiosInstance;
  feedback: FeedbackInterface;
}

/**
 * @class
 */
export class Routines {
  private readonly services: ServicesInterface;

  /**
   * @param {ServicesInterface} services
   */
  constructor(services: ServicesInterface) {
    this.services = services;
  }

  /**
   * Upload current package and run once, without overwriting remote
   *
   * @param {CreateRun} createRun
   * @returns {Promise<CompletedRunRecord>}
   */
  async debug(createRun: CreateRun): Promise<CompletedRunRecord> {
    return this.services.axios
      .post('/debug', createRun)
      .then((response: any) => new CompletedRunRecord(response))
      .catch(defaultApiError());
  }

  /**
   * Run routine immediately
   *
   * @param {string} routineId
   * @returns {Promise<CompletedRunRecord>}
   */
  async runImmediate(routineId: string): Promise<CompletedRunRecord> {
    return this.services.axios
      .post(`/routines/${routineId}/run`)
      .then((response: any) => new CompletedRunRecord(response))
      .catch(defaultApiError());
  }

  /**
   * Push update to routine
   *
   * @param {string} routineId
   * @param {UpdateRoutineInterface} updateRoutine
   * @returns {Promise<void>}
   */
  async push(routineId: string, updateRoutine: UpdateRoutineInterface): Promise<void> {
    await this.services.axios
      .put(`/routines/${routineId}`, updateRoutine)
      .catch(defaultApiError([HTTP_STATUS.NOT_FOUND]))
      .then((response: ApiErrorResponseInterface | any) => {
        if (isErrorResponse(response)) {
          const { _error } = response;
          if (_error?.code === HTTP_STATUS.NOT_FOUND) {
            throw new Error(
              "routine ID does not exist or does not exist in this project.\nRun 'asrtd init --merge' to create a new routine ID with existing routine."
            );
          }

          throw new Error(_error?.message || 'Error during push');
        }

        return response;
      });
  }

  /**
   * List routines, optionally in project
   *
   * @param {string} projectId
   * @returns {Promise<Routine[]>}
   */
  async list(projectId?: string): Promise<Routine[]> {
    return this.services.axios
      .get(projectId ? `/routines?project=${projectId}` : '/routines')
      .then((response: any) => response.list.map((item) => new Routine(item)))
      .catch(defaultApiError());
  }

  /**
   * Remove specific routine
   *
   * @param {string} routineId
   * @returns {Promise<void>}
   */
  async remove(routineId: string): Promise<void> {
    await this.services.axios.delete(`/routines/${routineId}`).catch(defaultApiError());
  }

  /**
   * Create new routine
   *
   * @param {CreateRoutineInterface} createRoutine
   * @returns {Promise<Routine>}
   */
  async create(createRoutine: CreateRoutineInterface): Promise<Routine> {
    return this.services.axios
      .post('/routines', createRoutine)
      .then((response: any) => new Routine(response))
      .catch(defaultApiError());
  }

  /**
   * Check that routine exists in the specified project
   *
   * @param {string} routineId
   * @param {string} projectId
   * @returns {Promise<void>}
   */
  async exists(routineId: string, projectId: string): Promise<void> {
    await this.services.axios.get(`/routines/${routineId}?project=${projectId}`).catch(defaultApiError());
  }

  /**
   * Enable routine
   *
   * @param {string} routineId
   * @returns {Promise<void>}
   */
  async enable(routineId: string): Promise<void> {
    await this.services.axios.post(`/routines/${routineId}/enable`).catch(defaultApiError());
  }

  /**
   * Disable routine
   *
   * @param {string} routineId
   * @returns {Promise<void>}
   */
  async disable(routineId: string): Promise<void> {
    await this.services.axios.post(`/routines/${routineId}/disable`).catch(defaultApiError());
  }
}
