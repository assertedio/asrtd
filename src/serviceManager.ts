import { Runner } from '@asserted/runner';
import { AxiosInstance } from 'axios';
import { exec, execSync } from 'child_process';
import Conf from 'conf';

import { Auth } from './actions/auth';
import { Plans } from './actions/plans';
import { Projects } from './actions/projects';
import { Records } from './actions/records';
import { Routines } from './actions/routines';
import { Stats } from './actions/stats';
import { Commands } from './commands';
import { ConfigInterface } from './config';
import { Interactions } from './interactions';
import { getInstance } from './lib/clients/axios';
import { Api } from './lib/services/api';
import feedback, { FeedbackInterface } from './lib/services/feedback';
import { GlobalConfig } from './lib/services/globalConfig';
import { LocalRunner } from './lib/services/localRunner';
import { RoutineConfigs } from './lib/services/routineConfigs';
import { RoutinePacker } from './lib/services/routinePacker';

export interface ServicesInterface {
  runner: Runner;
  routineConfigs: RoutineConfigs;
  routinePacker: RoutinePacker;
  localRunner: LocalRunner;
  axiosInstance: AxiosInstance;
  api: Api;
  interactions: Interactions;
  commands: Commands;
  globalConfig: GlobalConfig;
  feedback: FeedbackInterface;
}

export interface ActionsInterface {
  records: Records;
  routines: Routines;
  stats: Stats;
  auth: Auth;
  plans: Plans;
  projects: Projects;
}

/**
 * @class
 */
export class ServiceManager {
  readonly services: ServicesInterface;

  readonly actions: ActionsInterface;

  /**
   * @param {ConfigInterface} config
   */
  constructor(config: ConfigInterface) {
    this.services = ServiceManager.buildServices(config);
    this.actions = ServiceManager.buildActions(config, this.services);
  }

  /**
   * Build actions
   *
   * @param {ConfigInterface} config
   * @param {ServicesInterface} services
   * @returns {ActionsInterface}
   */
  static buildActions(config: ConfigInterface, services: ServicesInterface): ActionsInterface {
    const { feedback: feedbackInstance, routineConfigs, commands } = services;

    return {
      records: new Records({ routineConfigs, commands }),
      routines: new Routines({ feedback: feedbackInstance, routineConfigs, commands }),
      stats: new Stats({ routineConfigs, commands }),
      auth: new Auth({ commands }),
      plans: new Plans({ commands, routineConfigs }),
      projects: new Projects({ commands }),
    };
  }

  /**
   * Build services
   *
   * @param {ConfigInterface} config
   * @returns {ServicesInterface}
   */
  static buildServices(config: ConfigInterface): ServicesInterface {
    const { assertedDir, version, appHost, apiHost } = config;

    // TODO: Change to pjson name after project moves
    const conf = new Conf({ configName: 'asrtd', projectName: 'asrtd', projectVersion: version });

    const globalConfig = new GlobalConfig({ conf });
    const runner = new Runner({ exec, execSync }, { timeoutMarginMs: 2000 });
    const routineConfigs = new RoutineConfigs({ feedback }, { assertedDir });
    const routinePacker = new RoutinePacker({ routineConfigs }, { assertedDir });
    const localRunner = new LocalRunner({ runner, routineConfigs }, { assertedDir });
    const axiosInstance = getInstance(globalConfig, apiHost);
    const api = new Api({ axios: axiosInstance, feedback });
    const interactions = new Interactions({ globalConfig, feedback, api }, { assertedDir, appHost });
    const commands = new Commands(
      { interactions, routineConfigs, api, globalConfig, routinePacker, localRunner, exec, feedback },
      { appHost, assertedDir }
    );

    return {
      runner,
      routineConfigs,
      routinePacker,
      localRunner,
      axiosInstance,
      api,
      interactions,
      commands,
      globalConfig,
      feedback,
    };
  }
}
