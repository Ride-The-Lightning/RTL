import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
export let isDebugMode = environment.isDebugMode;
const noop = (): any => undefined;

export abstract class Logger {
  info: any;
  warn: any;
  error: any;
}

@Injectable()
export class LoggerService implements Logger {
  info: any;
  warn: any;
  error: any;
  invokeConsoleMethod(type: string, args?: any): void {}
}

@Injectable()
export class ConsoleLoggerService implements Logger {
  get info() {
    if (isDebugMode) {
      return console.log.bind(console);
    } else {
      return noop;
    }
  }

  get warn() {
    if (isDebugMode) {
      return console.warn.bind(console);
    } else {
      return noop;
    }
  }

  get error() {
    if (isDebugMode) {
      return console.error.bind(console);
    } else {
      return noop;
    }
  }

  invokeConsoleMethod(type: string, args?: any): void {
    const logFn: Function = (console)[type] || console.log || noop;
    logFn.apply(console, [args]);
  }
}
