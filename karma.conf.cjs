// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

// The specs run in a timezone that has daylight saving, wherever the machine is. The monthly
// reports broke only in such a zone (issue #1331), and CI runs in UTC, where their specs would
// pass with or without the fix. Headless Chrome takes its timezone from TZ. Europe/Berlin puts a
// clock change in March and in October.
process.env.TZ = 'Europe/Berlin';

// On macOS, Chrome's baseline JIT compiler makes the first run of any code in the test bundle
// very slow: the specs took about eight minutes on an Apple Silicon Mac with Chrome 157, against
// 14 seconds for the same specs on Linux. Without the JIT the same run takes under a minute.
// Linux keeps Chrome's defaults.
const headlessFlags = process.platform === 'darwin' ? ['--js-flags=--jitless'] : [];

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        // you can add configuration options for Jasmine here
        // the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
        // for example, you can disable the random execution with `random: false`
        // or set a specific seed with `seed: 4321`
      },
    },
    jasmineHtmlReporter: {
      suppressAll: true // removes the duplicated traces
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/rtlapp'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    customLaunchers: {
      // What `npm run test` uses.
      ChromeHeadlessTest: {
        base: 'ChromeHeadless',
        flags: headlessFlags
      }
    },
    restartOnFileChange: true
  });
};
