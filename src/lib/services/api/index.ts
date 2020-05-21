import { Auth, ServicesInterface as AuthServicesInterface } from './auth';
import { Plans, ServicesInterface as PlansServicesInterface } from './plans';
import { Projects, ServicesInterface as ProjectsServicesInterface } from './projects';
import { Records, ServicesInterface as RecordsServicesInterface } from './records';
import { Routines, ServicesInterface as RoutinesServicesInterface } from './routines';
import { ServicesInterface as StatsServicesInterface, Stats } from './stats';

export type ServicesInterface = AuthServicesInterface &
  ProjectsServicesInterface &
  RoutinesServicesInterface &
  RecordsServicesInterface &
  StatsServicesInterface &
  PlansServicesInterface;

/**
 * @class
 */
export class Api {
  readonly auth: Auth;

  readonly projects: Projects;

  readonly routines: Routines;

  readonly records: Records;

  readonly stats: Stats;

  readonly plans: Plans;

  /**
   * @param {ServicesInterface} services
   */
  constructor(services: ServicesInterface) {
    this.auth = new Auth(services);
    this.projects = new Projects(services);
    this.routines = new Routines(services);
    this.records = new Records(services);
    this.stats = new Stats(services);
    this.plans = new Plans(services);
  }
}
