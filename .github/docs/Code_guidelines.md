# Coding guidelines for RTL

Practices this codebase follows for TypeScript, Angular and its main libraries. They are
guidance for whoever writes the code, and apply to the code a change adds or touches; older
code does not always meet them, and moving it over is its own PR.

This is not a review checklist. What a reviewer checks is in `.github/REVIEW.md`, which also holds
the rules that have caused real bugs here (shared request options, effects that stop after
an error, store mutation, numbers that arrive as strings).

Before opening a pull request, read your diff against this file and run `npm run check`.
`npm run lint` enforces the guidelines a tool can decide outright. `npm run check` applies a
few more to the lines a branch changed, and prints warnings for patterns that usually break
one; fix each warning or explain it in the pull request. The rest need a person.

## TypeScript (`server/` and `src/`)

- **Guard what you did not create.** `strict`, `strictNullChecks` and `noImplicitAny` are
  off, so a missing value compiles. Check a node response, a parsed config file, `req.body`,
  `req.session.selectedNode` or a store selection before reading a property of it.
- **Do not silence the compiler.** No `@ts-ignore`, `@ts-expect-error` or `@ts-nocheck`;
  neither tree has one. Lint's hint to use `@ts-expect-error` in place of `@ts-ignore` does
  not apply.
- **Keep the models current.** A field added to or renamed in an API response goes into the
  interface in `src/app/shared/models/` or `server/models/`, not only through `any` where
  it is needed.
- **Catch `JSON.parse` of outside text**: a config file, a body requested without
  `json: true`, a WebSocket message.
- **Import CommonJS packages by their default export** in `server/` and destructure it
  (`import exprs from 'express'`, then `const { Router } = exprs`). A named import compiles
  and can still fail when Node loads `backend/`.
- **Leave no promise floating.** Return it, await it or end it in `.catch`.
- **Stay within the runtime.** `server/` uses nothing newer than Node 22, the lower bound of
  `engines.node`; `src/` uses nothing outside the ES2022 target and the `dom` library.
- **Give `parseInt` a radix.**

## Server (`server/`)

- **Express 5 request objects.** `req.query` is read-only, and `req.body` is `undefined`
  when no body was sent. Do not raise the 25 MB body limit in `app.ts`.
- **Keep axios inside `server/utils/request.ts`.** Put query parameters in `qs`, a form in
  `form` and JSON in `body`, not in the URL string. A failure arrives in the wrapper's shape
  (`statusCode`, `error`, `message`), which leaves the request headers out, so do not reach
  for `err.response` or `err.config`. Set `json: true` unless the caller parses the body
  itself.
- **`ws` server timers.** Do not start a timer when a module is imported, or `unref()` it,
  so it cannot hold the process or a test run open.
- **Node WebSocket clients** (`ws` for Eclair, `socket.io-client` for CLN). Keep one client
  per node, reconnect only through `reconnect` and its `reconnectTimeOut` guard, and close
  it on `DISCONNECT`.
- **`otplib`.** Leave the shared `authenticator` at its defaults; options go on a clone.
- **`ini` and `hocon-parser`** read node config files a user may have edited by hand. Catch
  a parse failure and report it, and pass the parsed object through `maskPasswords` before
  returning it.
- **Hash with Node's `crypto`.** The `sha256` package is for the browser.

## Angular (`src/app`)

- **End subscriptions with the component.** Pipe a `subscribe` in a component or directive
  through `takeUntil(this.unSubs[n])` or `take(1)`, and call `next()` and `complete()` on
  every entry in `ngOnDestroy`. Give `unSubs` a `Subject` for each index used: an index past
  the end of the array throws when the component loads. Put `takeUntil` last in the pipe;
  before a `switchMap` or `mergeMap` it leaves the inner subscription running.
- **Do not `subscribe` inside a `subscribe`.** Combine streams with `combineLatest`,
  `withLatestFrom` or a flattening operator.
- **Clear timers and listeners** in `ngOnDestroy`: a `setInterval`, a repeating
  `setTimeout`, a listener added by hand. For DOM events use an `(event)` binding or
  `@HostListener`, not `addEventListener`.
- **Lifecycle hooks.** The constructor injects and sets synchronous defaults; start store
  selects and dispatches in `ngOnInit`. Read an `@Input` first in `ngOnInit` or
  `ngOnChanges`, and a `@ViewChild` (`MatSort`, `MatPaginator`) in `ngAfterViewInit` or
  later, after the `*ngIf` around it is true.
- **Effects return an action on every path**, or are declared `{ dispatch: false }`.
- **Keep work out of template bindings.** A binding should not call a method that does work
  or returns a new array or object, since default change detection runs it on every cycle.
  Read a property set when the data changes, or use a pipe.
- **Declare where used.** A new component, directive or pipe is declared in the module that
  uses it (`lnd.module.ts`, `cln.module.ts`, `ecl.module.ts`), or declared and exported in
  `SharedModule` when more than one does.
- **Keep HTTP in effects and services.** A component dispatches an action or calls a
  service; it does not inject `HttpClient`.
- **Open dialogs through the store**, with the `openAlert` and `openConfirmation` actions,
  and read a confirmation's answer from `rtlEffects.closeConfirm` with the same teardown as
  any other subscription.
- **Check the other implementations.** A fix to an LND, CLN or Eclair component, effect or
  reducer usually has a counterpart in the other two.
- **Test behaviour.** A spec asserts what the change does, not only
  `expect(component).toBeTruthy()`. Use the mocks in `shared/test-helpers/mock-services.ts`,
  make no real HTTP request, and use `fakeAsync` rather than a real wait for timers.
- **Add no `eslint-disable`.**

## Frontend libraries

- **RxJS.** `combineLatest` emits nothing until every source has emitted, and
  `withLatestFrom` drops emissions until its other source has, so a stream added to either
  should be one that emits on load. Give `subscribe` an observer object when it handles
  errors, not separate callbacks, and do not use `toPromise`.
- **Angular Material modules** are imported and exported once, in `SharedModule`. A dialog
  component receives its input through `MAT_DIALOG_DATA` and closes through `MatDialogRef`.
- **Material tables.** When a `MatTableDataSource` is recreated, assign its `sort`,
  `paginator`, `sortingDataAccessor` and `filterPredicate` again, as the existing tables do.
  Add a new column to the page settings and to the filter predicate, and sort it as a number
  when it holds one.
- **`ngx-charts`.** Replace a chart's input with a new array instead of pushing to it: the
  charts are `OnPush` and do not redraw on a mutation.
- **`pdfmake`** is imported only by the component that builds the PDF, inside its lazy
  module, never by `SharedModule` or `AppModule`: it and its fonts are large.
- **Font Awesome icons** are imported one by one (`faEye`) and exposed as a component
  property. Importing a whole pack (`fas`, `far`) puts every icon in the bundle.
- **`Buffer`** in `src/` is for hex and base64 conversion only.
