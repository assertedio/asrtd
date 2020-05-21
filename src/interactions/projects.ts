import { ProjectInterface } from '@asserted/models';
import inquirer from 'inquirer';

import { Api } from '../lib/services/api';

export interface ServicesInterface {
  api: Api;
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
   * Select project
   *
   * @returns {Promise<ProjectInterface>}
   */
  async selectProject(): Promise<ProjectInterface> {
    const projects = await this.services.api.projects.list();

    if (projects.length === 1) {
      return projects[0];
    }

    if (projects.length === 0) {
      throw new Error('no projects linked to this user');
    }

    const projectResponse = await inquirer.prompt([
      {
        type: 'list',
        name: 'projectSelection',
        message: 'Select a project',
        choices: projects.map(({ name, id }) => ({ name: `${name} - ${id}`, value: id })),
      },
    ]);

    const project = projects.find(({ id }) => projectResponse.projectSelection === id);

    if (!project) {
      throw new Error('Somehow selected invalid project');
    }

    return project;
  }
}
