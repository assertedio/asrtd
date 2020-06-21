import { expect } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import sinon from 'sinon';

import { RoutinePacker } from '../../../src/lib/services/routinePacker';

const OUTPUT_DIR = path.join(__dirname, '../../output');
const RESOURCE_DIR = path.join(__dirname, '../../resources/lib/services/routinePacker');

describe('routinePacker unit tests', () => {
  beforeEach(async () => {
    await fs.remove(OUTPUT_DIR);
    await fs.ensureDir(OUTPUT_DIR);
    sinon.restore();
  });

  after(() => sinon.restore());

  it('pack example', async () => {
    const servivces = {
      routineConfigs: {
        dependenciesWarning: sinon.stub().resolves(),
      } as any,
    };

    const routinePacker = new RoutinePacker(servivces, { assertedDir: RESOURCE_DIR });
    const { package: routineString } = await routinePacker.pack();
    await routinePacker.unpack(routineString, OUTPUT_DIR);

    const files = await fs.readdir(OUTPUT_DIR);

    expect(files).to.eql(['example.asrtd.js', 'package.json', 'routine.json']);
  });
});
