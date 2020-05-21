import { Auth, ServicesInterface as AuthServicesInterface } from './auth';
import { Plans, ServicesInterface as PlansServicesInterface } from './plans';
import { Projects, ServicesInterface as ProjectsServicesInterface } from './projects';
import { Records, ServicesInterface as ResultsServicesInterface } from './records';
import { ConfigInterface as RoutinesConfigInterface, Routines, ServicesInterface as RoutinesServicesInterface } from './routines';
import { ServicesInterface as StatsServicesInterface, Stats } from './stats';

export type ServicesInterface = RoutinesServicesInterface &
  AuthServicesInterface &
  ResultsServicesInterface &
  ProjectsServicesInterface &
  PlansServicesInterface &
  StatsServicesInterface;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ConfigInterface extends RoutinesConfigInterface {}

/**
 * @class
 */
export class Commands {
  readonly routines: Routines;

  readonly auth: Auth;

  readonly results: Records;

  readonly projects: Projects;

  readonly plans: Plans;

  readonly stats: Stats;

  /**
   * @param {ServicesInterface} services
   * @param {ConfigInterface} config
   */
  constructor(services: ServicesInterface, config: ConfigInterface) {
    this.routines = new Routines(services, config);
    this.auth = new Auth(services);
    this.results = new Records(services);
    this.projects = new Projects(services);
    this.plans = new Plans(services);
    this.stats = new Stats(services);
  }
}
