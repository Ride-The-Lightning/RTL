// Extra lint rules that `npm run check` applies to changed lines only: older code breaks them.
// `errors` fail the check. `advisories` are printed as warnings for the author to judge: each
// matches a pattern that is usually, but not always, a departure from Code_guidelines.md or REVIEW.md.
import base from '../../eslint.config.js';

const baseSyntax = base.map((config) => config.rules && config.rules['no-restricted-syntax']).filter(Array.isArray).pop() || ['error'];

const errors = {
  nestedSubscribe: {
    selector: "CallExpression[callee.property.name='subscribe'] > :matches(ArrowFunctionExpression, FunctionExpression, ObjectExpression) CallExpression[callee.property.name='subscribe']",
    message: 'Do not subscribe inside a subscribe; combine the streams with an operator.'
  },
  outerCatchError: {
    selector: "CallExpression[callee.property.name='pipe'][callee.object.property.name=/^actions\\$?$/] > CallExpression[callee.name='catchError']",
    message: 'catchError on the outer actions stream ends the effect at the first failure; move it into the inner pipe.'
  }
};

const advisories = {
  jsonParse: {
    selector: "CallExpression[callee.object.name='JSON'][callee.property.name='parse']:not([arguments.0.callee.property.name='stringify']):not(TryStatement > .block CallExpression)",
    message: 'JSON.parse outside try/catch: catch it if the text comes from a file, a node or a socket.'
  },
  constructorWork: {
    selector: "MethodDefinition[kind='constructor'] CallExpression[callee.property.name=/^(subscribe|dispatch)$/]",
    message: 'Store selects and dispatches start in ngOnInit, not the constructor.'
  },
  setInterval: {
    selector: "CallExpression[callee.name='setInterval'], CallExpression[callee.property.name='setInterval']",
    message: 'Clear this interval in ngOnDestroy.'
  },
  takeUntilNotLast: {
    selector: "CallExpression[callee.property.name='pipe'] > CallExpression[callee.name='takeUntil'] ~ CallExpression[callee.name=/^(switchMap|mergeMap|concatMap|exhaustMap)$/]",
    message: 'A flattening operator after takeUntil leaves its inner subscription running; put takeUntil last in the pipe.'
  },
  bypassSecurity: {
    selector: 'CallExpression[callee.property.name=/^bypassSecurityTrust/]',
    message: 'bypassSecurityTrust* takes only a constant shipped with RTL, never node or peer data.'
  },
  noTeardown: {
    selector: "CallExpression[callee.property.name='subscribe']:not(:has(CallExpression[callee.name=/^(takeUntil|take|first|takeUntilDestroyed)$/]))",
    message: 'This subscription has no takeUntil(this.unSubs[n]) or take(1); it outlives the component unless the source completes.'
  },
  matDialog: {
    selector: "ImportSpecifier[imported.name='MatDialog']",
    message: 'Open dialogs through the openAlert and openConfirmation store actions.'
  },
  stateMutation: {
    selector: "AssignmentExpression[left.object.name='state'], AssignmentExpression[left.object.object.name='state'], CallExpression[callee.property.name=/^(push|splice|sort|reverse|unshift|pop|shift)$/][callee.object.object.name='state']",
    message: 'This looks like a mutation of store state; return a new object or array.'
  },
  errInternals: {
    selector: "MemberExpression[property.name=/^(response|config)$/][object.name=/^err/]",
    message: 'Errors from utils/request.ts have statusCode, error and message; err.response and err.config are not set.'
  },
  insecureTls: {
    selector: "Property[key.name='rejectUnauthorized'][value.value=false]",
    message: 'rejectUnauthorized: false is for the configured node and Loop server only.'
  },
  mathRandom: {
    selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
    message: 'Use crypto.randomBytes if this value is a secret or a token.'
  },
  openRoute: {
    selector: "CallExpression[callee.object.name='router'][callee.property.name=/^(get|post|put|patch|delete)$/]:not(:has(Identifier[name='isAuthenticated']))",
    message: 'This route has no isAuthenticated; a public route needs a stated reason.'
  }
};

const pick = (group, ...names) => names.map((name) => group[name]);
const syntax = (...extra) => ({ 'no-restricted-syntax': [...baseSyntax, ...extra] });

const srcAll = [errors.nestedSubscribe, ...pick(advisories, 'jsonParse', 'constructorWork', 'setInterval', 'takeUntilNotLast', 'bypassSecurity')];
const serverAll = pick(advisories, 'jsonParse', 'errInternals', 'insecureTls', 'mathRandom');

export const changedLineErrors = { rules: ['@typescript-eslint/no-floating-promises', 'radix'], messages: Object.values(errors).map((entry) => entry.message) };
export const changedLineWarnings = { rules: ['@angular-eslint/template/no-call-expression'], messages: Object.values(advisories).map((entry) => entry.message) };

// A later object replaces no-restricted-syntax for the files it matches, so each one lists everything that applies.
export default [
  ...base,
  { files: ['**/*.ts'], rules: { radix: 'error' } },
  { files: ['server/**/*.ts'], rules: { '@typescript-eslint/no-floating-promises': 'error', ...syntax(...serverAll) } },
  { files: ['server/utils/request.ts'], rules: syntax(advisories.jsonParse) },
  { files: ['server/routes/**/*.ts'], rules: syntax(...serverAll, advisories.openRoute) },
  { files: ['src/**/*.ts'], rules: syntax(...srcAll) },
  { files: ['src/**/*.component.ts', 'src/**/*.directive.ts'], rules: syntax(...srcAll, ...pick(advisories, 'noTeardown', 'matDialog')) },
  { files: ['src/**/*.effects.ts'], rules: syntax(...srcAll, errors.outerCatchError) },
  { files: ['src/**/*.reducers.ts'], rules: syntax(...srcAll, advisories.stateMutation) },
  { files: ['**/*.spec.ts'], rules: syntax() },
  { files: ['src/**/*.html'], rules: { '@angular-eslint/template/no-call-expression': 'error' } }
];
