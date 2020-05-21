/* eslint no-process-env: "off" */
import getenv from 'getenv';

import pjson from '../package.json';
import { Config, ConfigInterface } from './config';
import { getAssertedDir } from './lib/services/utils';

const DEFAULT_API_BASE_URL = 'https://api.asserted.io/v1';
const DEFAULT_APP_BASE_URL = 'https://app.asserted.io';

export const load = (): Config => {
  const config: ConfigInterface = {
    version: pjson.version,
    name: pjson.name.replace(/^@[\d-AZa-z-]+\//g, ''),

    apiHost: getenv('API_HOST', DEFAULT_API_BASE_URL),
    appHost: getenv('APP_HOST', DEFAULT_APP_BASE_URL),
    assertedDir: getAssertedDir(),
  };

  return new Config(config);
};
