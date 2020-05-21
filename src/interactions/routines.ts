/* eslint-disable class-methods-use-this */
import { ProjectInterface } from '@asserted/models';
import inquirer from 'inquirer';

import { Api } from '../lib/services/api';

export interface ServicesInterface {
  api: Api;
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
   * Confirm delete
   *
   * @param {string} routineId
   * @returns {Promise<boolean>}
   */
  async confirmDelete(routineId: string): Promise<boolean> {
    const { confirm } = await inquirer.prompt([
      {
        name: 'confirm',
        default: false,
        type: 'confirm',
        message: `Confirm delete of routine: ${routineId}`,
      },
    ]);

    return confirm;
  }

  /**
   * Select project
   *
   * @param {string} projectId
   * @returns {Promise<ProjectInterface>}
   */
  async selectRoutine(projectId?: string): Promise<ProjectInterface> {
    const routines = await this.services.api.routines.list(projectId);

    if (routines.length === 1) {
      return routines[0];
    }

    if (routines.length === 0) {
      throw new Error('no routines linked to this user');
    }

    const response = await inquirer.prompt([
      {
        type: 'list',
        name: 'selection',
        message: 'Select a routine',
        choices: routines.map(({ name, id }) => ({ name: `${name} - ${id}`, value: id })),
      },
    ]);

    const routine = routines.find(({ id }) => response.selection === id);

    if (!routine) {
      throw new Error('Somehow selected invalid routine');
    }

    return routine;
  }
}
/* eslint-enable class-methods-use-this */
