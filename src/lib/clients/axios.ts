import axios, { AxiosInstance, AxiosStatic } from 'axios';
import Err from 'err';
import HTTP_STATUS from 'http-status';
import { isObject } from 'lodash';
import osName from 'os-name';

import pjson from '../../../package.json';
import logger from '../../logger';
import { GlobalConfig } from '../services/globalConfig';

const log = logger('axios');

export interface ApiErrorResponseInterface {
  [k: string]: any;
  _error: { code: number; message?: string; headers?: { [k: string]: any } };
}

/**
 * Type check for error response
 *
 * @param {any | ApiErrorResponseInterface} input
 * @returns {boolean}
 */
export const isErrorResponse = (input: any | ApiErrorResponseInterface): input is ApiErrorResponseInterface => {
  return isObject(input) && !!(input as ApiErrorResponseInterface)?._error;
};

/**
 * Get axios instance
 *
 * @param {GlobalConfig} globalConfig
 * @param {string} apiHost
 * @param {AxiosStatic} axiosFactory
 * @returns {AxiosInstance}
 */
export const getInstance = (globalConfig: GlobalConfig, apiHost: string, axiosFactory: AxiosStatic = axios): AxiosInstance => {
  const axiosInstance = axiosFactory.create({
    baseURL: apiHost,
    headers: {
      'content-type': 'application/json',
      asrtd: pjson.version,
      nodejs: process.version.replace('v', ''),
      platform: `${osName()}; ${process.arch}`,
    },
  });

  axiosInstance.interceptors.request.use(
    async (config) => {
      log(`Request config: ${JSON.stringify(config)}`);

      const currentToken = globalConfig.getApiKey();

      if (config?.headers?.Authorization || config?.headers?.authorization) {
        log('Auth header already set');
      } else if (currentToken && currentToken.length > 0) {
        log(`Using token: ${currentToken}`);
        config.headers.Authorization = `Bearer ${currentToken}`;
      } else {
        log('No token to attach');
      }

      return config;
    },
    (error) => {
      throw error;
    }
  );

  axiosInstance.interceptors.response.use(
    (response) => {
      return Array.isArray(response.data.data) ? { list: response.data.data } : response.data.data || {};
    },
    (error) => {
      if (error?.response?.data?.message) {
        throw new Err(error.response.data.message, error.response.status, error.response.data.data || {});
      }

      throw error;
    }
  );

  return axiosInstance;
};

type NumberArray = number[];
type MoreThanOneNumberArray = [number, ...number[]];

/**
 * All API calls should return 2xx codes where possible.
 * For cases where that intentionally doesn't happen, the error code is appended to the response data (if any)
 *
 * Why not just do this in the axios handler? Because we need to be able to conditionally not notify for some calls
 *
 * @param {number[]} noNotifyCodes
 * @returns {Function}
 */
export function defaultApiError<T extends NumberArray>(noNotifyCodes: NumberArray = []) {
  return (error: Err): T extends MoreThanOneNumberArray ? ApiErrorResponseInterface : never => {
    if (error.code && noNotifyCodes.includes(error.code)) {
      return { ...error.data, _error: { code: error.code, message: error.message } };
    }

    if (error.code && (error.code === HTTP_STATUS.UNAUTHORIZED || error.code === HTTP_STATUS.FORBIDDEN)) {
      throw new Error(`${HTTP_STATUS[error.code]}: try explicitly setting the project ID or re-running \`asrtd login\``);
    }

    throw error;
  };
}
