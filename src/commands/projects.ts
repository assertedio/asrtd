import { ProjectInterface } from '@asserted/models';
import chalk from 'chalk';
import { table } from 'table';

import { Interactions } from '../interactions';
import { Api } from '../lib/services/api';
import { FeedbackInterface } from '../lib/services/feedback';
import { GlobalConfig } from '../lib/services/globalConfig';
import { TABLE_CONFIG } from './utils';

export interface ServicesInterface {
  globalConfig: GlobalConfig;
  api: Api;
  interactions: Interactions;
  feedback: FeedbackInterface;
}

/**
 * @class
 */
export class Projects {
  private readonly services: ServicesInterface;

  /**
   * @param {ServicesInterface} services
   */
  constructor(services: ServicesInterface) {
    this.services = services;
  }

  /**
   * @param {ProjectInterface[]} projects
   * @returns {any[]}
   */
  static getProjectTableData(projects: ProjectInterface[]): any[] {
    // TODO: Show plans and quotas here
    const headers = [chalk.blue.bold('Project ID'), chalk.blue.bold('Project Name')];

    return [headers, ...projects.map(({ id, name }) => [id, name])];
  }

  /**
   * @returns {Promise<void>}
   */
  async list(): Promise<void> {
    const projects = await this.services.api.projects.list();
    this.services.feedback.noIdent(table(Projects.getProjectTableData(projects), TABLE_CONFIG));
  }
}
