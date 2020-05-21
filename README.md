# asrtd

![asserted logo](https://raw.githubusercontent.com/assertedio/asrtd/master/images/logo-dark.png)

asserted.io command line interface

Test in prod. Continously integration test your app with tests written in Mocha.

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

To get a timeline of the how the status has changed recently, run:

```bash
asrtd timeline
```

To get a list of recent records, run:

```bash
asrtd records
```

![asrtd records](https://raw.githubusercontent.com/assertedio/asrtd/master/images/records.png)



# Commands

At any time you can run `asrtd --help` to get a list of available commands.
