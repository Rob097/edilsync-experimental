import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.split('=');
    return [key.replace(/^--/, ''), rest.join('=')];
  }),
);

const sessionId = args.sessionId || process.env.EDILSYNC_TEST_SESSION_ID || `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(3).toString('hex')}`;
const label = args.label || 'Unnamed suite';
const category = args.category || 'misc';
const command = args.command;
const projectRoot = process.cwd();

if (!command) {
  throw new Error('Missing --command for run-command-with-report.mjs');
}

const suiteSlug = (args.suite || label.toLowerCase())
  .replace(/[^a-z0-9]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  || 'suite';

const reportsRoot = path.join(projectRoot, 'tests', 'reports');
const sessionDataDir = path.join(reportsRoot, 'data', sessionId);
const sessionLogsDir = path.join(reportsRoot, 'logs', sessionId);
mkdirSync(sessionDataDir, { recursive: true });
mkdirSync(sessionLogsDir, { recursive: true });

const rawLogPath = path.join(sessionLogsDir, `${suiteSlug}.log`);
const playwrightJsonReportPath = path.join(sessionLogsDir, `${suiteSlug}.playwright.json`);
const activityLogPath = path.join(sessionLogsDir, `${suiteSlug}.activity.jsonl`);
const playwrightHtmlReportPath = path.join(projectRoot, 'tests', 'playwright-report', sessionId, suiteSlug);
const playwrightOutputDir = path.join(projectRoot, 'tests', 'test-results', sessionId, suiteSlug);

const startedAt = new Date();
let combinedOutput = '';

const childEnv = {
  ...process.env,
  EDILSYNC_TEST_SESSION_ID: sessionId,
  PLAYWRIGHT_JSON_OUTPUT_FILE: playwrightJsonReportPath,
  PLAYWRIGHT_HTML_OUTPUT_FOLDER: playwrightHtmlReportPath,
  PLAYWRIGHT_OUTPUT_DIR: playwrightOutputDir,
  EDILSYNC_TEST_ACTIVITY_FILE: activityLogPath,
};

const child = spawn(command, {
  cwd: projectRoot,
  env: childEnv,
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
});

child.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  combinedOutput += text;
  process.stdout.write(text);
});

child.stderr.on('data', (chunk) => {
  const text = chunk.toString();
  combinedOutput += text;
  process.stderr.write(text);
});

const exitCode = await new Promise((resolve) => {
  child.on('close', (code) => resolve(code ?? 1));
});

const endedAt = new Date();
writeFileSync(rawLogPath, combinedOutput);

let structuredResults = null;
try {
  const playwrightJson = JSON.parse(readFileSync(playwrightJsonReportPath, 'utf8'));
  const tests = [];

  const flattenSuite = (suite, parents = []) => {
    const trail = [...parents, suite.title].filter(Boolean);

    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const lastResult = test.results?.at(-1) || {};
        tests.push({
          project: test.projectName || lastResult.workerIndex || 'playwright',
          file: spec.file || spec.title || 'unknown',
          title: [...trail, spec.title, test.title].filter(Boolean).join(' > '),
          status: lastResult.status || test.status || 'unknown',
          duration: lastResult.duration ? `${Math.round(lastResult.duration)}ms` : 'n/a',
        });
      }
    }

    for (const childSuite of suite.suites || []) {
      flattenSuite(childSuite, trail);
    }
  };

  for (const suite of playwrightJson.suites || []) {
    flattenSuite(suite, []);
  }

  structuredResults = {
    stats: playwrightJson.stats || null,
    tests,
  };
} catch {
  structuredResults = null;
}

let activityLog = null;
try {
  activityLog = readFileSync(activityLogPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
} catch {
  activityLog = null;
}

const runRecord = {
  sessionId,
  suiteSlug,
  label,
  category,
  command,
  startedAt: startedAt.toISOString(),
  endedAt: endedAt.toISOString(),
  durationMs: endedAt.getTime() - startedAt.getTime(),
  status: exitCode === 0 ? 'passed' : 'failed',
  output: combinedOutput,
  rawLogPath: path.relative(projectRoot, rawLogPath),
  playwrightJsonReportPath: structuredResults ? path.relative(projectRoot, playwrightJsonReportPath) : null,
  playwrightHtmlReportPath: structuredResults ? path.relative(projectRoot, playwrightHtmlReportPath) : null,
  structuredResults,
  activityLog,
};

writeFileSync(path.join(sessionDataDir, `${suiteSlug}.json`), JSON.stringify(runRecord, null, 2));

const reportBuilder = spawn(`node ./tests/scripts/build-test-report.mjs --sessionId=${sessionId}`, {
  cwd: projectRoot,
  env: process.env,
  shell: true,
  stdio: 'inherit',
});

await new Promise((resolve) => reportBuilder.on('close', resolve));

process.exit(exitCode);