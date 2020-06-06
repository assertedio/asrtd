import { ValidatedBase } from '@asserted/models';
import { IsString, IsUrl } from 'class-validator';

export interface ConfigInterface {
  name: string;
  version: string;
  apiHost: string;
  appHost: string;
  assertedDir: string;
}

/**
 * @class
 */
export class Config extends ValidatedBase implements ConfigInterface {
  /**
   * @param {ConfigInterface} params
   * @param {boolean} validate
   */
  constructor(params: ConfigInterface, validate = true) {
    super();

    this.name = params.name;
    this.version = params.version;
    this.apiHost = params.apiHost;
    this.appHost = params.appHost;
    this.assertedDir = params.assertedDir;

    if (!validate) {
      this.validate();
    }
  }

  @IsString()
  name: string;

  @IsString()
  version: string;

  @IsUrl({ require_tld: false }) // This allows localhost urls
  apiHost: string;

  @IsUrl({ require_tld: false }) // This allows localhost urls
  appHost: string;

  @IsString()
  assertedDir: string;
}
