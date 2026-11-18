#!/usr/bin/env node
// Checks this branch's changes against the review rules a script can decide.
// Usage: npm run check [-- <base-branch>]   (default: the newest Release-x.y.z branch)
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { changedLineErrors, changedLineWarnings } from './eslint.changed.config.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }).trim();
const lines = (text) => (text ? text.split('\n') : []);

const findBase = () => {
  const current = git('rev-parse', '--abbrev-ref', 'HEAD');
  const refs = lines(git('for-each-ref', '--format=%(refname:short)', 'refs/heads', 'refs/remotes')).
    map((ref) => ({ ref, version: (/(?:^|\/)Release-(\d+)\.(\d+)\.(\d+)$/).exec(ref) })).
    filter((entry) => entry.version && entry.ref !== current).
    map((entry) => ({ ref: entry.ref, version: entry.version.slice(1).map(Number) }));
  if (!refs.length) { return null; }
  const newer = (a, b) => (b.version[0] - a.version[0]) || (b.version[1] - a.version[1]) || (b.version[2] - a.version[2]);
  const newest = refs.sort(newer)[0].version.join('.');
  // Several remotes may carry the branch; the one with the most recent merge base is the least stale.
  return refs.filter((entry) => entry.version.join('.') === newest).
    map((entry) => ({ ref: entry.ref, time: +git('show', '-s', '--format=%ct', git('merge-base', 'HEAD', entry.ref)) })).
    sort((a, b) => b.time - a.time)[0].ref;
};

const base = process.argv[2] || process.env.RTL_CHECK_BASE || findBase();
if (!base) {
  console.error('No Release-x.y.z branch found. Pass the base branch: npm run check -- <base-branch>');
  process.exit(2);
}
const mergeBase = git('merge-base', 'HEAD', base);
const untracked = lines(git('ls-files', '--others', '--exclude-standard'));
const changed = [...new Set([...lines(git('diff', '--name-only', '--diff-filter=ACMR', mergeBase)), ...untracked])];

// Line numbers each file gained, in the working tree.
const addedLines = (file) => {
  const added = new Set();
  if (untracked.includes(file)) {
    readFileSync(join(root, file), 'utf8').split('\n').forEach((line, idx) => added.add(idx + 1));
    return added;
  }
  lines(git('diff', '-U0', mergeBase, '--', file)).forEach((line) => {
    const hunk = (/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/).exec(line);
    if (hunk) {
      const count = hunk[2] === undefined ? 1 : +hunk[2];
      for (let i = 0; i < count; i++) { added.add(+hunk[1] + i); }
    }
  });
  return added;
};
const addedText = (file) => {
  const text = readFileSync(join(root, file), 'utf8').split('\n');
  return [...addedLines(file)].map((num) => ({ num, text: text[num - 1] || '' }));
};

const failures = [];
const warnings = [];
const fail = (where, message) => failures.push(where + '  ' + message);
const warn = (where, message) => warnings.push(where + '  ' + message);
const listed = (group, message) => group.rules.includes(message.ruleId) || group.messages.includes(message.message);
const isSource = (file) => (/^(src|server)\/.*\.(ts|html)$/).test(file);
const any = (test) => changed.some(test);

if (any((file) => (/^server\/.*\.ts$/).test(file)) && !any((file) => file.startsWith('backend/'))) {
  warn('backend/', 'server/ changed but backend/ did not. Unless the change emits no JavaScript, run: npm run buildbackend');
}
if (any((file) => file.startsWith('src/') && !file.endsWith('.spec.ts')) && !any((file) => file.startsWith('frontend/'))) {
  warn('frontend/', 'src/ changed but frontend/ did not. Unless the change is outside the bundle, run: npm run buildfrontend');
}
if (any((file) => (/^(src|server)\//).test(file)) && !any((file) => (/^release-notes\/Release-notes-.*\.md$/).test(file))) {
  fail('release-notes/', 'src/ or server/ changed without a release-note entry.');
}
changed.filter(isSource).forEach((file) => {
  addedText(file).filter((line) => (/eslint-disable/).test(line.text)).forEach((line) => {
    fail(file + ':' + line.num, 'New eslint-disable. Fix the finding instead.');
  });
});
if (changed.includes('package.json')) {
  addedText('package.json').filter((line) => (/^\s*"[^"]+":\s*"[\^~]/).test(line.text)).forEach((line) => {
    fail('package.json:' + line.num, 'Dependency versions stay exact (no ^ or ~).');
  });
}
if (changed.includes('package-lock.json')) {
  addedText('package-lock.json').filter((line) => (/"resolved":/).test(line.text) && !(/"resolved": "https:\/\/registry\.npmjs\.org\//).test(line.text)).forEach((line) => {
    fail('package-lock.json:' + line.num, 'Resolved URL is not on registry.npmjs.org.');
  });
}

// Lint the changed files: every error counts, and the stricter rules count on added lines only,
// some of them as warnings.
const lintFiles = changed.filter((file) => isSource(file) && existsSync(join(root, file)));
if (lintFiles.length) {
  const eslint = spawnSync(process.execPath, [join(root, 'node_modules', 'eslint', 'bin', 'eslint.js'), '-c', join(root, '.github', 'scripts', 'eslint.changed.config.js'), '-f', 'json', ...lintFiles],
    { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  let results = null;
  try { results = JSON.parse(eslint.stdout); } catch (err) {
    console.error(eslint.stderr || eslint.stdout);
    process.exit(2);
  }
  results.forEach((result) => {
    const file = relative(root, result.filePath);
    const added = addedLines(file);
    result.messages.filter((message) => message.severity === 2).forEach((message) => {
      const where = file + ':' + message.line;
      if (listed(changedLineWarnings, message)) {
        if (added.has(message.line)) { warn(where, message.message); }
      } else if (!listed(changedLineErrors, message) || added.has(message.line)) {
        fail(where, message.message + (message.ruleId ? ' (' + message.ruleId + ')' : ''));
      }
    });
  });
}

console.log('Checked ' + changed.length + ' changed file(s) against ' + base + '.');
if (process.env.GITHUB_ACTIONS) {
  // Show each finding on the pull request's diff as well as in the log.
  const annotate = (level) => (entry) => {
    const [where, ...message] = entry.split('  ');
    const at = (/^(.*):(\d+)$/).exec(where);
    console.log('::' + level + (at ? ' file=' + at[1] + ',line=' + at[2] : '') + '::' + (at ? '' : where + ' ') + message.join('  '));
  };
  warnings.forEach(annotate('warning'));
  failures.forEach(annotate('error'));
}
if (warnings.length) {
  console.log(warnings.length + ' warning(s), for you to judge; they do not fail the check:');
  warnings.forEach((warning) => console.log('  ' + warning));
}
if (failures.length) {
  console.error(failures.length + ' problem(s) to fix:');
  failures.forEach((failure) => console.error('  ' + failure));
}
if (warnings.length || failures.length) {
  console.log('See .github/docs/Code_guidelines.md and .github/REVIEW.md.');
} else {
  console.log('No problems found.');
}
process.exit(failures.length ? 1 : 0);
