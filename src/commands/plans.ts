import { PLAN_TIERS, PlanInterface } from '@asserted/models';
import chalk from 'chalk';

import { Interactions } from '../interactions';
import { Api } from '../lib/services/api';
import { FeedbackInterface } from '../lib/services/feedback';

export interface ServicesInterface {
  api: Api;
  feedback: FeedbackInterface;
  interactions: Interactions;
}

/**
 * @class
 */
export class Plans {
  private readonly services: ServicesInterface;

  /**
   * @param {ServicesInterface} services
   */
  constructor(services: ServicesInterface) {
    this.services = services;
  }

  /**
   * Get current project plan
   *
   * @returns {Promise<void>}
   * @param projectId
   */
  async get(projectId?: string): Promise<void> {
    projectId = projectId || (await this.services.interactions.projects.selectProject()).id;

    const { name } = await this.services.api.projects.get(projectId);
    const plans = await this.services.api.plans.listPlans();
    const { planId, limits, payment } = await this.services.api.plans.get(projectId);

    const plan = plans.find(({ id }) => id === planId) as PlanInterface;

    let paidStatus;

    if (plan.tier === PLAN_TIERS.FREE) {
      paidStatus = chalk.green('Free');
    } else {
      paidStatus = payment?.delinquent ? chalk.red('Unpaid') : chalk.green('Paid');
    }

    this.services.feedback.info(chalk.bold(`Current Plan for Project: '${name}' - ${projectId}`));
    this.services.feedback.note(` Name: ${plan.name}`);
    this.services.feedback.note(` Tier: ${plan.tier}`);
    this.services.feedback.note(` Status: ${paidStatus}`);
    this.services.feedback.note('');
    this.services.feedback.info(chalk.bold('Monthly Plan Limits'));
    this.services.feedback.note(` Total Test Time: ${limits.cpuSeconds} seconds`);
    this.services.feedback.note(` Routines: ${limits.routines}`);
    this.services.feedback.note(` SMS: ${limits.smsCount}`);
  }
}
