import debug from 'debug';

import pjson from '../package.json';

/**
 * Get logger
 *
 * @param {string} prefix
 * @returns {debug}
 */
export default function getLogger(prefix) {
  return debug(`${pjson.name}:${prefix}`);
}
