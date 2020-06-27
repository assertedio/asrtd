import {
  CompletedRunRecord,
  Debug,
  DEPENDENCIES_VERSIONS,
  isDependenciesObject,
  RoutineConfig as RoutineConfigModel,
  RoutineConfigInterface,
  RUN_FAIL_TYPE,
  RUN_STATUS,
  Search,
  TEST_EVENT_TYPES,
  TestDataInterface,
  TestErrorInterface,
} from '@asserted/models';
import chalk from 'chalk';
import { capitalCase } from 'change-case';
import figures from 'figures';
import { last, isNumber } from 'lodash';
import { DateTime } from 'luxon';
import ora from 'ora';
import { table } from 'table';

import { logSummary } from '@asserted/pack';
import { Interactions } from '../interactions';
import { Api } from '../lib/services/api';
import { FeedbackInterface } from '../lib/services/feedback';
import { LocalRunner, RunInterface } from '../lib/services/localRunner';
import { RoutineConfigs } from '../lib/services/routineConfigs';
import { RoutinePacker } from '../lib/services/routinePacker';
import { getColorOfStatus, shortHumanizer } from '../lib/services/utils';
import { DURATION_CONFIG, TABLE_CONFIG } from './utils';
import { InternalSocket } from '../lib/clients/internalSocket';

// import getLogger from '../logger';

export interface ServicesInterface {
  api: Api;
  routineConfigs: RoutineConfigs;
  feedback: FeedbackInterface;
  localRunner: LocalRunner;
  routinePacker: RoutinePacker;
  interactions: Interactions;
  internalSocket: InternalSocket;
}

interface GroupedPass {
  start: Date;
  end?: Date;
}

const isGroupedPass = (input: GroupedPass | CompletedRunRecord): input is GroupedPass => {
  return !!(input as GroupedPass).start;
};

/**
 * @class
 */
export class Records {
  private readonly services: ServicesInterface;

  /**
   * @param {ServicesInterface} services
   */
  constructor(services: ServicesInterface) {
    this.services = services;
  }

  /**
   * Get data for records table
   *
   * @param {records} records
   * @returns {any}
   */
  static getRecordsTable(records: (CompletedRunRecord | GroupedPass)[]): string[][] {
    const headers = [
      chalk.blue.bold('Record ID'),
      chalk.blue.bold('Status'),
      chalk.blue.bold('Timestamp'),
      chalk.blue.bold('Duration'),
      chalk.blue.bold('Suites'),
      chalk.blue.bold('Tests'),
      chalk.blue.bold('Passes'),
      chalk.blue.bold('Fails'),
      chalk.blue.bold('Pending'),
    ];

    return [
      headers,
      ...records.map((record) => {
        if (!isGroupedPass(record)) {
          const failMessage =
            record?.failType === RUN_FAIL_TYPE.TEST ? `${capitalCase(record?.failType)} failure` : capitalCase(record?.failType || '');

          return [
            record.id,
            chalk[getColorOfStatus(record.status)](record.status === RUN_STATUS.FAILED && record.failType ? failMessage : capitalCase(record.status)),
            DateTime.fromJSDate(record.completedAt).toLocaleString(DateTime.DATETIME_SHORT),
            shortHumanizer(record.testDurationMs, DURATION_CONFIG),
            record.stats?.suites,
            record.stats?.tests,
            chalk.green(record.stats?.passes || 0),
            chalk.red(record.stats?.failures || 0),
            record.stats?.pending,
          ];
        }

        return [
          '',
          chalk.green('Multiple\nPasses'),
          '',
          shortHumanizer((record.end?.valueOf() || Date.now()) - record.start.valueOf(), DURATION_CONFIG),
          '',
          '',
          '',
          '',
          '',
        ];
      }),
    ];
  }

  /**
   * Records
   *
   * @param {boolean} showPasses
   * @param {Search} search
   * @param {string} routineId
   * @returns {Promise<void>}
   */
  async records(showPasses: boolean, search: Search, routineId?: string): Promise<void> {
    routineId = routineId || (await this.services.interactions.routines.selectRoutine()).id;

    const { list, nextAfter, prevBefore } = await this.services.api.records.search(routineId, search);
    const records = list.reduce((result, record) => {
      if (record.status === RUN_STATUS.PASSED && !showPasses) {
        const previousRecord = last(result);

        if (previousRecord && isGroupedPass(previousRecord)) {
          (last(result) as GroupedPass).end = record.completedAt;
          return result;
        }

        result.push({ start: record.completedAt });
        return result;
      }

      result.push(record);
      return result;
    }, [] as (CompletedRunRecord | GroupedPass)[]);

    this.services.feedback.noIdent(table(Records.getRecordsTable(records.reverse()), TABLE_CONFIG));
    if (prevBefore) {
      const prev = DateTime.fromJSDate(prevBefore).toLocal().toISO();
      this.services.feedback.note(`${chalk.bold.blueBright(figures.arrowLeft)} prev page arg:   --prevBefore ${prev}`);
    }
    if (nextAfter) {
      const next = DateTime.fromJSDate(nextAfter).toLocal().toISO();
      this.services.feedback.note(`${chalk.bold.blueBright(figures.arrowRight)} next page arg:   --nextAfter ${next}`);
    }
  }

  /**
   * Get terminal string with nicely formatted test errors
   *
   * @param {TestErrorInterface[] | null} errors
   * @returns {string | null}
   */
  static getErrors(errors: TestErrorInterface[] | null): string | null {
    if (errors && errors.length > 0) {
      return errors
        .map((error) => {
          return `\n${chalk.bold(error.fullTitle)}\n\n${chalk.red(error.stack)}\n\n${chalk.green('+ expected')} ${chalk.red('- actual')}\n\n${(
            error.diff || ''
          )
            .split('\n')
            .map((line) => (line.startsWith('+') ? chalk.green(line) : chalk.red(line)))
            .join('\n')}`;
        })
        .join('\n\n');
    }

    return null;
  }

  /**
   * Get test times table
   *
   * @param {TestDataInterface[]} results
   * @returns {string[]}
   */
  static getTimesTable(results: TestDataInterface[]): string[][] {
    const headers = [chalk.blue.bold('Title'), chalk.blue.bold('Duration'), chalk.blue.bold('Passed')];

    return [
      headers,
      ...results.map(({ duration, fullTitle, error }) => [
        fullTitle || '',
        isNumber(duration) ? `${duration} ms` : ' - ',
        error ? chalk.red(figures.cross) : chalk.green(figures.tick),
      ]),
    ];
  }

  /**
   * Show the summary for a single record
   *
   * @param {string} recordId
   * @param {boolean} excludeHooks
   * @param {string} routineId
   * @returns {Promise<void>}
   */
  async record(recordId: string, excludeHooks: boolean, routineId?: string): Promise<void> {
    routineId = routineId || (await this.services.interactions.routines.selectRoutine()).id;

    const record = await this.services.api.records.get(routineId, recordId);

    this.showCompleted(record, excludeHooks);
  }

  /**
   * Show completed record tables and errors
   *
   * @param {CompletedRunRecord} record
   * @param {boolean} excludeHooks
   * @returns {void}
   */
  showCompleted(record: CompletedRunRecord, excludeHooks: boolean): void {
    // Little gross with the way I'm forcing in fullTitle, but don't want to create a new type right now
    const errors = (record.results || [])
      .filter(({ error }) => !!error)
      .map(({ error, fullTitle }) => ({ ...error, fullTitle })) as TestErrorInterface[];

    const errorString = Records.getErrors(errors);
    const recordTable = table(Records.getRecordsTable([record]), TABLE_CONFIG);

    const resultsTable = table(
      Records.getTimesTable(
        (record.results || []).filter(
          ({ type }) => !excludeHooks || (type !== TEST_EVENT_TYPES.EVENT_HOOK_BEGIN && type !== TEST_EVENT_TYPES.EVENT_HOOK_END)
        )
      ),
      TABLE_CONFIG
    );

    const result = errorString ? `${errorString}\n\n${recordTable}\n\n${resultsTable}` : `${recordTable}\n\n${resultsTable}`;

    this.services.feedback.noIdent(result);
  }

  /**
   * Local run
   *
   * @param {RunInterface} params
   * @returns {Promise<void>}
   */
  async local(params: RunInterface): Promise<void> {
    let routine: RoutineConfigInterface = await this.services.routineConfigs.readOrThrow();
    routine = new RoutineConfigModel({ ...routine, mocha: { ...routine.mocha, ...params } });

    this.services.feedback.note('');
    this.services.feedback.info(chalk.bold('Console:'));
    const result = await this.services.localRunner.run(routine);

    if (result) {
      this.services.feedback.note('');
      this.services.feedback.note('');
      this.services.feedback.info(chalk.bold('Results:'));
      this.showCompleted(result, false);
    }

    this.services.feedback.success('Local run complete');
  }

  /**
   * Run pushed routine immediately
   *
   * @param {string} routineId
   * @returns {Promise<void>}
   */
  async runImmediate(routineId?: string): Promise<void> {
    if (!routineId) {
      const { id }: RoutineConfigInterface = await this.services.routineConfigs.readOrThrow();
      routineId = id;
    }

    this.services.feedback.info(`Immediately running pushed version of routine ID: ${routineId}`);
    this.services.feedback.info(`NOTE: ${chalk.yellow('This run is not added to records and will not trigger notifications')}`);

    this.services.feedback.note('');
    this.services.feedback.info(chalk.bold('Console:'));
    const result = await this.services.api.routines.runImmediate(routineId);

    if (result) {
      this.services.feedback.note('');
      this.services.feedback.note('');
      this.services.feedback.info(chalk.bold('Results:'));
      this.showCompleted(result, false);
    }

    this.services.feedback.success('Immediate run complete');
  }

  /**
   * Optionally debug and wait with socket
   *
   * @param {Debug} debugRun
   * @returns {Promise<CompletedRunRecord>}
   */
  async debugWithSocket(debugRun: Debug): Promise<CompletedRunRecord> {
    const { wait: runWait } = this.services.internalSocket.waitForRecord();

    this.services.feedback.note('Running routine online...');

    const { recordId, cachedDependencies, dependencies } = await this.services.api.routines.debugAsync(debugRun);
    this.services.internalSocket.addRecordId(recordId);

    if (isDependenciesObject(debugRun.dependencies)) {
      if (!cachedDependencies) {
        const buildSpinner = ora('Building custom dependencies (may take a minute) ...').start();

        const { wait } = this.services.internalSocket.waitForBuild();
        this.services.internalSocket.addBuildId(dependencies);

        const console = await wait;

        if (console) {
          buildSpinner.clear();
          throw new Error(`Build failed: ${console}`);
        }

        buildSpinner.succeed('Built custom dependencies');
      } else {
        this.services.feedback.success('Using cached custom dependencies');
      }
    } else {
      this.services.feedback.success('Using fixed dependencies');
    }

    const runSpinner = ora('Waiting for run to complete...').start();
    await runWait;
    const result = await this.services.api.routines.getDebugRecord(recordId);

    if (!result) {
      runSpinner.clear();
      throw new Error('Could not find result of run');
    }

    runSpinner.succeed('Run complete');
    return result;
  }

  /**
   * Debug without socket connection
   *
   * @param {Debug} debugRun
   * @returns {Promise<CompletedRunRecord>}
   */
  async debugWithoutSocket(debugRun: Debug): Promise<CompletedRunRecord> {
    const spinner = ora('Running routine online...').start();

    try {
      const result = await this.services.api.routines.debug(debugRun);
      spinner.succeed('Done');
      return result;
    } catch (error) {
      spinner.fail('Online run failure');
      throw error;
    }
  }

  /**
   * Run routine once online, without replacing existing routine
   *
   * @param {RunInterface} params
   * @param {boolean} showSummary
   * @returns {Promise<void>}
   */
  async debug(params: RunInterface, showSummary = true): Promise<void> {
    let routine: RoutineConfigInterface = await this.services.routineConfigs.readOrThrow();
    routine = new RoutineConfigModel({ ...routine, mocha: { ...routine.mocha, ...params } });

    this.services.feedback.info(`NOTE: ${chalk.yellow('Online runs may be rate limited')}`);
    this.services.feedback.info(
      `Use '${chalk.green('asrtd run')}' for development, and '${chalk.green('asrtd run --online')}' only for debugging issues with pushed routines.`
    );
    this.services.feedback.note('');
    const { package: packageString, shrinkwrapJson, packageJson, summary } = await this.services.routinePacker.pack();

    if (showSummary) {
      logSummary(summary);
      this.services.feedback.note('');
    }

    const debugRun = new Debug({
      dependencies: routine.dependencies === DEPENDENCIES_VERSIONS.CUSTOM ? { shrinkwrapJson, packageJson } : routine.dependencies,
      mocha: routine.mocha,
      package: packageString,
    });

    const result = (await this.services.internalSocket.hasSocket()) ? await this.debugWithSocket(debugRun) : await this.debugWithoutSocket(debugRun);

    if (result.console) {
      this.services.feedback.note('');
      this.services.feedback.info(chalk.bold('Console:'));
      this.services.feedback.noIdent(result.console);
    }

    this.services.feedback.note('');
    this.services.feedback.note('');
    this.services.feedback.info(chalk.bold('Results:'));
    this.showCompleted(result, false);
    this.services.internalSocket.disconnect();
  }
}
