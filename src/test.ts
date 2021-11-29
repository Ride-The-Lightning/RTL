/* eslint-disable capitalized-comments */
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

declare const require: any;
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(), {
    teardown: { destroyAfterEach: false }
}
);

const context = require.context('./', true, /\.spec\.ts$/);
// const context = require.context('./app/lnd/transactions/send-payment-modal', true, /\.spec\.ts$/);
// const context = require.context('./app/store', true, /\.spec\.ts$/);

context.keys().map(context);
