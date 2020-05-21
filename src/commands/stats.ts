import { RoutineStatus, Search, TimelineEventInterface } from '@asserted/models';
import Bluebird from 'bluebird';
import chalk from 'chalk';
import { capitalCase } from 'change-case';
import figures from 'figures';
import { round } from 'lodash';
import { DateTime } from 'luxon';
import { table } from 'table';

import { Interactions } from '../interactions';
import { Api } from '../lib/services/api';
import { FeedbackInterface } from '../lib/services/feedback';
import { RoutineConfigs } from '../lib/services/routineConfigs';
import { getColorOfStatus, shortHumanizer } from '../lib/services/utils';
import { DURATION_CONFIG, DURATION_CONFIG_MIN_MIN, DURATION_CONFIG_SEC_MIN, TABLE_CONFIG } from './utils';

// import getLogger from '../logger';

export interface ServicesInterface {
  api: Api;
  routineConfigs: RoutineConfigs;
  feedback: FeedbackInterface;
  interactions: Interactions;
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
   * Get status table
   *
   * @param {RoutineStatus} routineStatuses
   * @returns {any}
   */
  static getStatusTable(routineStatuses: { id: string; routineStatus: RoutineStatus }[]): string[][] {
    const headers = [
      chalk.blue.bold('Routine ID'),
      chalk.blue.bold('Next Run'),
      chalk.blue.bold('Status'),
      chalk.blue.bold('Since'),
      chalk.blue.bold('Duration'),
      chalk.blue.bold('Latest\nDowntime'),
      chalk.blue.bold('Downtime\nDuration'),
      chalk.blue.bold('Uptime\nDay'),
      chalk.blue.bold('Uptime\nWeek'),
      chalk.blue.bold('Uptime\nMonth'),
    ];

    return [
      headers,
      ...routineStatuses.map(({ id, routineStatus }) => {
        const { status, overallStatus, downtime, uptimes, nextRunAt } = routineStatus;
        const { day, week, month } = uptimes;

        return [
          id,
          nextRunAt ? shortHumanizer(nextRunAt.valueOf() - Date.now(), DURATION_CONFIG_SEC_MIN) : '-',
          chalk[getColorOfStatus(overallStatus)](capitalCase(overallStatus)),
          status ? DateTime.fromJSDate(status.start).toLocaleString(DateTime.DATETIME_SHORT) : '-',
          status ? shortHumanizer(Date.now() - status.start.valueOf(), DURATION_CONFIG_MIN_MIN) : '-',
          downtime ? DateTime.fromJSDate(downtime.start).toLocaleString(DateTime.DATETIME_SHORT) : '-',
          downtime ? shortHumanizer(downtime.durationMs, DURATION_CONFIG_MIN_MIN) : '-',
          // eslint-disable-next-line no-magic-numbers
          status ? round(day.tests.availability * 100, 2) : '-',
          // eslint-disable-next-line no-magic-numbers
          status ? round(week.tests.availability * 100, 2) : '-',
          // eslint-disable-next-line no-magic-numbers
          status ? round(month.tests.availability * 100, 2) : '-',
        ];
      }),
    ];
  }

  /**
   * Get timeline of status
   *
   * @param {TimelineEventInterface[]} events
   * @returns {any}
   */
  static getTimeline(events: TimelineEventInterface[]): string[][] {
    const headers = [chalk.blue.bold('Status'), chalk.blue.bold('Started'), chalk.blue.bold('Duration')];

    return [
      headers,
      ...events.map(
        (event) => [
          chalk[getColorOfStatus(event.status)](event.status),
          DateTime.fromJSDate(event.start).toLocaleString(DateTime.DATETIME_SHORT),
          shortHumanizer(event.end.valueOf() - event.start.valueOf(), DURATION_CONFIG),
        ],
        [] as any
      ),
    ];
  }

  /**
   * Get routine stats
   *
   * @param {Search} search
   * @param {string} routineId
   * @returns {Promise<void>}
   */
  async timeline(search: Search, routineId?: string): Promise<void> {
    routineId = routineId || (await this.services.interactions.routines.selectRoutine()).id;

    const { list, nextAfter, prevBefore } = await this.services.api.stats.timelineEvents(routineId, search);

    this.services.feedback.noIdent(table(Stats.getTimeline(list), TABLE_CONFIG));
    if (prevBefore) {
      const prev = DateTime.fromJSDate(prevBefore).toLocal().toISO();
      this.services.feedback.note(`${chalk.bold.blueBright(figures.arrowLeft)} prev page arg:   --prevBefore ${prev}`);
    }
    if (nextAfter) {
      const next = DateTime.fromJSDate(nextAfter).toLocal().toISO();
      this.services.feedback.note(`${chalk.bold.blueBright(figures.arrowRight)} next page arg:   --nextAfter ${next}`);
    }
  }

  /**
   * Get routine stats
   *
   * @param {boolean} all
   * @param {string} projectId
   * @param {string} routineId
   * @returns {Promise<void>}
   */
  async status(all: boolean, projectId?: string, routineId?: string): Promise<void> {
    projectId = projectId || (await this.services.interactions.projects.selectProject()).id;

    let routineIds: string[];

    if (all) {
      routineIds = (await this.services.api.routines.list(projectId)).map(({ id }) => id);
    } else {
      routineIds = [routineId || (await this.services.interactions.routines.selectRoutine(projectId)).id];
    }

    const statuses = await Bluebird.map(routineIds, async (id) => ({ id, routineStatus: await this.services.api.stats.status(id) }));
    this.services.feedback.noIdent(table(Stats.getStatusTable(statuses), TABLE_CONFIG));
  }
}
