# asrtd

![asserted logo](https://raw.githubusercontent.com/assertedio/asrtd/master/images/logo-dark.png)

[asserted.io](https://asserted.io) command line interface

Test in prod. Continously integration test your app with tests written in [Mocha](https://mochajs.org/).

## Installation

Install the command line client and log in. 

```bash
npm i -g asrtd
asrtd login
```

Move to your project directory and initialize.

```bash
cd my-project
asrtd init
```

This will create an `.asserted/` directory containing the following:

```bash
routine.json    ## Routine configuration with interval and mocha config
package.json    ## NPM package defining the (currently) fixed set of dependencies available during testing
examples/       ## Directory containing examples, can be modified or removed   
```

## Developing Locally

Create some tests inside `.asserted/` (or modify the tests in `examples/`), then run them using the command below:

```bash
asrtd run
```

![asrtd records](https://raw.githubusercontent.com/assertedio/asrtd/master/images/local.png)

By default, test files should be suffixed with `.asrtd.js` to be picked up by Mocha, but that can be configured in `routine.json`.

## Push to asserted.io

When you're ready to run them continuously, use:

```bash
asrtd push
```

They'll immediately start running on asserted.io with the interval that you specified. 
Go to `app.asserted.io` to configure the notification preferences for test failures to get pinged by email, SMS, or Slack webhook.

## Status, Timeline, and Records

To see the current status of the routine associated with the current directory, run:

```bash
asrtd status
```

![asrtd records](https://raw.githubusercontent.com/assertedio/asrtd/master/images/status.png)

To get a timeline of the how the status has changed recently, run:

```bash
asrtd timeline
```

![asrtd records](https://raw.githubusercontent.com/assertedio/asrtd/master/images/timeline.png)

To get a list of recent records, run:

```bash
asrtd records
```

![asrtd records](https://raw.githubusercontent.com/assertedio/asrtd/master/images/records.png)



# Commands

At any time you can run `asrtd --help` to get a list of available commands.

![asrtd records](https://raw.githubusercontent.com/assertedio/asrtd/master/images/help.png)


# Included Dependencies

For the moment, the dependencies available to tests are fixed, though we expect to support custom dependencies in the future.

## Major libraries

- mocha - [NPM](http://npmjs.com/package/mocha) - [Docs](https://mochajs.org/)
- chai - [NPM](https://www.npmjs.com/package/chai) - [Docs](https://www.chaijs.com/)
- sinon - [NPM](https://www.npmjs.com/package/sinon) - [Docs](https://sinonjs.org/)
- axios - [NPM](https://www.npmjs.com/package/axios) - [Docs](https://www.npmjs.com/package/axios)
- lodash - [NPM](https://www.npmjs.com/package/lodash) - [Docs](https://lodash.com/)

## All Available Dependencies

```json
{
    "ajv": "^6.12.2",
    "async": "^3.2.0",
    "axios": "^0.19.2",
    "bcrypt": "^4.0.1",
    "bluebird": "^3.7.2",
    "chai": "^4.2.0",
    "cookie": "^0.4.1",
    "crypto-js": "^4.0.0",
    "dotenv": "^8.2.0",
    "faker": "^4.1.0",
    "fs-extra": "^9.0.0",
    "getenv": "^1.0.0",
    "got": "^11.1.3",
    "http-status": "^1.4.2",
    "ip": "^1.1.5",
    "jsdom": "^16.2.2",
    "jsonwebtoken": "^8.5.1",
    "lodash": "^4.17.15",
    "luxon": "^1.24.1",
    "mocha": "^7.1.2",
    "moment": "^2.25.3",
    "ms": "^2.1.2",
    "node-fetch": "^2.6.0",
    "qs": "^6.9.4",
    "ramda": "^0.27.0",
    "request": "^2.88.2",
    "request-promise": "^4.2.5",
    "sinon": "^9.0.2",
    "tar": "^6.0.2",
    "underscore": "^1.10.2",
    "uuid": "^8.0.0",
    "validator": "^13.0.0"
}
```
