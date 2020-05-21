import { Bucket, ListResponse, RoutineStatus, Search, TimelineEvent, Uptime } from '@asserted/models';
import { AxiosInstance } from 'axios';

import { defaultApiError } from '../../clients/axios';

export interface ServicesInterface {
  axios: AxiosInstance;
}

/**
 * @class
 */
export class Stats {
  private readonly services: ServicesInterface;

  /**
   * @param {ServicesInterface} services
   */
  constructor(services: ServicesInterface) {
    this.services = services;
  }

  /**
   * Routine status
   *
   * @param {string} routineId
   * @returns {Promise<RoutineStatus>}
   */
  async status(routineId: string): Promise<RoutineStatus> {
    return this.services.axios
      .get(`/routines/${routineId}/status`)
      .then((response: any) => new RoutineStatus(response))
      .catch(defaultApiError());
  }

  /**
   * Uptimes for routine
   *
   * @param {string} routineId
   * @returns {Promise<{ day: Uptime, week: Uptime, month: Uptime }>}
   */
  async uptimes(routineId: string): Promise<{ day: Uptime; week: Uptime; month: Uptime }> {
    return this.services.axios
      .get(`/routines/${routineId}/uptimes`)
      .then((response: any) => ({
        day: new Uptime(response.day),
        week: new Uptime(response.week),
        month: new Uptime(response.month),
      }))
      .catch(defaultApiError());
  }

  /**
   * Get buckets
   *
   * @param {string} routineId
   * @returns {Promise<Bucket[]>}
   */
  async buckets(routineId: string): Promise<Bucket[]> {
    return this.services.axios
      .get(`/routines/${routineId}/buckets`)
      .then((response: any) => response.list.map((bucket) => new Bucket(bucket)))
      .catch(defaultApiError());
  }

  /**
   * Timeline events
   *
   * @param {string} routineId
   * @param {Search} search
   * @returns {Promise<ListResponse<TimelineEvent>>}
   */
  async timelineEvents(routineId: string, search: Search): Promise<ListResponse<TimelineEvent>> {
    return this.services.axios
      .post(`/routines/${routineId}/timelines`, search)
      .then((response: any) => new ListResponse(response, TimelineEvent))
      .catch(defaultApiError());
  }
}
