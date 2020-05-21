import { Auth, ConfigInterface as AuthConfigInterface, ServicesInterface as AuthServicesInterface } from './auth';
import { ConfigInterface as InitConfigInterface, Init } from './init';
import { Projects, ServicesInterface as ProjectsServicesInterface } from './projects';
import { Routines, ServicesInterface as RoutinesServicesInterface } from './routines';

type ServicesInterface = AuthServicesInterface & ProjectsServicesInterface & RoutinesServicesInterface;

type ConfigInterface = InitConfigInterface & AuthConfigInterface;

/**
 * @class
 */
export class Interactions {
  readonly auth: Auth;

  readonly init: Init;

  readonly routines: Routines;

  readonly projects: Projects;

  /**
   * @param {ServicesInterface} services
   * @param {ConfigInterface} config
   */
  constructor(services: ServicesInterface, config: ConfigInterface) {
    this.auth = new Auth(services, config);
    this.init = new Init(services, config);
    this.routines = new Routines(services);
    this.projects = new Projects(services);
  }
}
