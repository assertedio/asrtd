/* eslint-disable no-unused-expressions */
import io from 'socket.io-client';
import Bluebird from 'bluebird';
import { SOCKET_EVENTS } from '@asserted/models';
import LRU from 'lru-cache';
import logger from '../../logger';
import { GlobalConfig } from '../services/globalConfig';

const log = logger('socket');

interface ServicesInterface {
  globalConfig: GlobalConfig;
}

interface ConfigInterface {
  apiHost: string;
}

/**
 * @class
 */
export class InternalSocket {
  private readonly services: ServicesInterface;

  private readonly config: ConfigInterface;

  socket: SocketIOClient.Socket | null = null;

  // eslint-disable-next-line no-magic-numbers
  builds: LRU<string, () => void> = new LRU<string, () => void>(50);

  // eslint-disable-next-line no-magic-numbers
  records: LRU<string, () => void> = new LRU<string, () => void>(50);

  /**
   * @param {ServicesInterface} services
   * @param {ConfigInterface} config
   */
  constructor(services: ServicesInterface, config: ConfigInterface) {
    this.services = services;
    this.config = config;
  }

  /**
   * Get Socket
   *
   * @returns {Promise<SocketIOClient.Socket | null>}
   */
  async hasSocket(): Promise<boolean> {
    const token = this.services.globalConfig.getApiKey();

    if (!token) {
      log('no token, skipping socket');
      return false;
    }
    if (this.socket) return true;

    log('getting socket..');

    const socket = io(this.config.apiHost, {
      path: '/v1/socket',
      transportOptions: {
        polling: {
          extraHeaders: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    });

    return (
      new Bluebird<boolean>((resolve) => {
        socket.on('connect', () => {
          this.socket = socket;
          log('socket connected');
          resolve(true);
        });
      })
        // eslint-disable-next-line no-magic-numbers
        .timeout(500, 'Timed out waiting for socket')
        .catch((error) => {
          log(error.stack);
          return false;
        })
    );
  }

  /**
   * Add run ID and call resolve if present
   *
   * @param {string} recordId
   * @returns {void}
   */
  addRecordId(recordId: string): void {
    log(`Adding record id: ${recordId}`);
    const resolve = this.records.get(recordId);
    if (resolve) {
      resolve();
    } else {
      this.records.set(recordId, () => null);
    }
  }

  /**
   * Add build ID and call resolve if present
   *
   * @param {string} buildId
   * @returns {void}
   */
  addBuildId(buildId: string): void {
    log(`Adding build id: ${buildId}`);
    const resolve = this.builds.get(buildId);
    if (resolve) {
      resolve();
    } else {
      this.builds.set(buildId, () => null);
    }
  }

  /**
   * Wait for run to complete
   *
   * This is maybe a bit more complicated than expected because there is no way
   * to know which order the calls come in.
   *
   * @returns {{ wait: Promise<string | undefined>; cancel: () => void }}
   */
  waitForRecord(): { wait: Promise<{ id: string; routineId: string }>; cancel: () => void } {
    if (!this.socket) {
      throw new Error('no socket to wait for');
    }

    log('Waiting for run record event...');

    let cancel;

    const wait = new Promise<{ id: string; routineId: string }>((resolve) => {
      const listener = ({ id, routineId }) => {
        log(`Got record event: ${JSON.stringify({ id, routineId })}`);

        if (this.records.has(id)) {
          this.socket?.removeListener(SOCKET_EVENTS.MANUAL_RUN_COMPLETE, listener);
          resolve({ id, routineId });
        } else {
          this.records.set(id, () => {
            this.socket?.removeListener(SOCKET_EVENTS.MANUAL_RUN_COMPLETE, listener);
            resolve({ id, routineId });
          });
        }
      };

      cancel = () => this.socket?.removeListener(SOCKET_EVENTS.MANUAL_RUN_COMPLETE, listener);

      this.socket?.on(SOCKET_EVENTS.MANUAL_RUN_COMPLETE, listener);
    });

    return {
      wait,
      cancel,
    };
  }

  /**
   * Wait for build to complete
   *
   * This is maybe a bit more complicated than expected because there is no way
   * to know which order the calls come in.
   *
   * @returns {{ wait: Promise<string | undefined>; cancel: () => void }}
   */
  waitForBuild(): { wait: Promise<string | undefined>; cancel: () => void } {
    if (!this.socket) {
      throw new Error('no socket to wait for');
    }

    log('Waiting for build event...');

    let cancel;

    const wait = new Promise<string | undefined>((resolve) => {
      const listener = ({ id, console }) => {
        log(`Got build event: ${JSON.stringify({ id, console })}`);

        if (this.builds.has(id)) {
          this.socket?.removeListener(SOCKET_EVENTS.DEP_BUILD_COMPLETE, listener);
          resolve(console);
        } else {
          this.builds.set(id, () => {
            this.socket?.removeListener(SOCKET_EVENTS.DEP_BUILD_COMPLETE, listener);
            resolve(console);
          });
        }
      };

      cancel = () => this.socket?.removeListener(SOCKET_EVENTS.DEP_BUILD_COMPLETE, listener);

      this.socket?.on(SOCKET_EVENTS.DEP_BUILD_COMPLETE, listener);
    });

    return {
      wait,
      cancel,
    };
  }

  /**
   * Disconnect
   *
   * @returns {void}
   */
  disconnect(): void {
    log('disconnecting socket');
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    this.socket = null;
  }
}
/* eslint-enable no-unused-expressions */
