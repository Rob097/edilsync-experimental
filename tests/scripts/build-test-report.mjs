import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const reportsRoot = path.join(projectRoot, 'tests', 'reports');
const dataRoot = path.join(reportsRoot, 'data');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDuration(durationMs) {
  const seconds = Math.round(durationMs / 100) / 10;
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round((seconds % 60) * 10) / 10;
  return `${minutes}m ${remainder}s`;
}

function getSessionRuns(sessionId) {
  const sessionDir = path.join(dataRoot, sessionId);
  if (!existsSync(sessionDir)) return [];

  return readdirSync(sessionDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => JSON.parse(readFileSync(path.join(sessionDir, fileName), 'utf8')))
    .sort((left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime());
}

function collectSessions() {
  if (!existsSync(dataRoot)) return [];

  return readdirSync(dataRoot)
    .filter((entry) => statSync(path.join(dataRoot, entry)).isDirectory())
    .map((sessionId) => {
      const runs = getSessionRuns(sessionId);
      const startedAt = runs[0]?.startedAt ?? statSync(path.join(dataRoot, sessionId)).mtime.toISOString();
      const endedAt = runs.at(-1)?.endedAt ?? startedAt;
      const failedRuns = runs.filter((run) => run.status === 'failed').length;
      const passedRuns = runs.filter((run) => run.status === 'passed').length;
      const skippedRuns = runs.filter((run) => run.status === 'skipped').length;

      return {
        sessionId,
        startedAt,
        endedAt,
        runCount: runs.length,
        failedRuns,
        passedRuns,
        skippedRuns,
        status: failedRuns > 0 ? 'failed' : skippedRuns === runs.length ? 'skipped' : 'passed',
      };
    })
    .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime());
}

function renderRun(run) {
  const artifacts = [];
  if (run.rawLogPath) {
    artifacts.push(`<a href="${escapeHtml(path.relative(reportsRoot, path.join(projectRoot, run.rawLogPath)).replace(/\\/g, '/'))}">Raw log</a>`);
  }
  if (run.playwrightHtmlReportPath) {
    artifacts.push(`<a href="${escapeHtml(path.relative(reportsRoot, path.join(projectRoot, run.playwrightHtmlReportPath)).replace(/\\/g, '/'))}">Playwright HTML</a>`);
  }
  if (run.playwrightJsonReportPath) {
    artifacts.push(`<a href="${escapeHtml(path.relative(reportsRoot, path.join(projectRoot, run.playwrightJsonReportPath)).replace(/\\/g, '/'))}">Playwright JSON</a>`);
  }

  const activities = Array.isArray(run.activityLog)
    ? run.activityLog.map((entry) => `<li><strong>${escapeHtml(entry.type)}</strong> <span>${escapeHtml(JSON.stringify(entry))}</span></li>`).join('')
    : '';

  const tests = Array.isArray(run.structuredResults?.tests)
    ? run.structuredResults.tests.map((entry) => `
      <tr>
        <td>${escapeHtml(entry.project || 'n/a')}</td>
        <td>${escapeHtml(entry.file || 'n/a')}</td>
        <td>${escapeHtml(entry.title)}</td>
        <td>${escapeHtml(entry.status)}</td>
        <td>${escapeHtml(entry.duration ?? 'n/a')}</td>
      </tr>`).join('')
    : '';

  return `
    <section class="run-card status-${escapeHtml(run.status)}">
      <div class="run-head">
        <div>
          <h2>${escapeHtml(run.label)}</h2>
          <p>${escapeHtml(run.category)} · ${escapeHtml(run.status)} · ${escapeHtml(formatDuration(run.durationMs))}</p>
        </div>
        <div class="artifacts">${artifacts.join(' · ') || 'No extra artifacts'}</div>
      </div>
      <div class="run-meta">
        <div><strong>Started:</strong> ${escapeHtml(run.startedAt)}</div>
        <div><strong>Ended:</strong> ${escapeHtml(run.endedAt)}</div>
        <div><strong>Command:</strong> <code>${escapeHtml(run.command)}</code></div>
      </div>
      ${tests ? `
      <details open>
        <summary>Executed tests</summary>
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>File</th>
              <th>Test</th>
              <th>Status</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>${tests}</tbody>
        </table>
      </details>` : ''}
      ${activities ? `
      <details>
        <summary>Observed users and actions</summary>
        <ul class="activity-list">${activities}</ul>
      </details>` : ''}
      <details>
        <summary>Captured output</summary>
        <pre>${escapeHtml(run.output)}</pre>
      </details>
    </section>`;
}

function renderSessionPage(sessionId) {
  const runs = getSessionRuns(sessionId);
  if (runs.length === 0) return;

  const failedRuns = runs.filter((run) => run.status === 'failed').length;
  const sessionStatus = failedRuns > 0 ? 'failed' : 'passed';
  const categories = [...new Set(runs.map((run) => run.category))].sort();
  const totalDuration = runs.reduce((sum, run) => sum + run.durationMs, 0);
  const sessionHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>EdilSync Test Report ${escapeHtml(sessionId)}</title>
    <style>
      :root { color-scheme: light; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: #f6f1ea; color: #231b18; }
      main { max-width: 1200px; margin: 0 auto; padding: 32px 20px 64px; }
      a { color: #c24a2f; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .summary { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin: 24px 0; }
      .summary-card, .run-card { background: white; border: 1px solid rgba(35, 27, 24, 0.08); border-radius: 18px; box-shadow: 0 18px 48px rgba(35, 27, 24, 0.08); }
      .summary-card { padding: 18px; }
      .run-card { padding: 20px; margin-bottom: 16px; }
      .status-failed { border-color: rgba(186, 26, 26, 0.25); }
      .status-passed { border-color: rgba(33, 128, 76, 0.2); }
      .run-head { display: flex; justify-content: space-between; gap: 16px; align-items: start; }
      .run-head h2 { margin: 0 0 4px; font-size: 1.15rem; }
      .run-meta { display: grid; gap: 8px; margin: 14px 0 18px; }
      code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      pre { white-space: pre-wrap; background: #161311; color: #f9f4ef; padding: 16px; border-radius: 14px; overflow-x: auto; }
      details { margin-top: 12px; }
      summary { cursor: pointer; font-weight: 600; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid rgba(35, 27, 24, 0.08); vertical-align: top; }
      .activity-list { margin: 12px 0 0; padding-left: 18px; }
      .artifacts { font-size: 0.92rem; color: #6e5b54; text-align: right; }
    </style>
  </head>
  <body>
    <main>
      <a href="./index.html">Back to sessions</a>
      <h1>EdilSync unified test report</h1>
      <p>Session <strong>${escapeHtml(sessionId)}</strong> · ${escapeHtml(sessionStatus)} · ${escapeHtml(formatDuration(totalDuration))}</p>
      <div class="summary">
        <div class="summary-card"><strong>Total suites</strong><div>${runs.length}</div></div>
        <div class="summary-card"><strong>Failed suites</strong><div>${failedRuns}</div></div>
        <div class="summary-card"><strong>Categories</strong><div>${escapeHtml(categories.join(', '))}</div></div>
        <div class="summary-card"><strong>Started</strong><div>${escapeHtml(runs[0].startedAt)}</div></div>
      </div>
      ${runs.map(renderRun).join('')}
    </main>
  </body>
</html>`;

  writeFileSync(path.join(reportsRoot, `${sessionId}.html`), sessionHtml);
}

function renderIndexPage() {
  const sessions = collectSessions();
  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>EdilSync Test Sessions</title>
    <style>
      body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: #f6f1ea; color: #231b18; }
      main { max-width: 1000px; margin: 0 auto; padding: 32px 20px 64px; }
      a { color: #c24a2f; text-decoration: none; }
      a:hover { text-decoration: underline; }
      table { width: 100%; border-collapse: collapse; background: white; border-radius: 18px; overflow: hidden; box-shadow: 0 18px 48px rgba(35, 27, 24, 0.08); }
      th, td { text-align: left; padding: 14px 12px; border-bottom: 1px solid rgba(35, 27, 24, 0.08); }
      th { background: #efe3d5; }
      .status-failed { color: #ba1a1a; }
      .status-passed { color: #21804c; }
      .status-skipped { color: #8c766e; }
    </style>
  </head>
  <body>
    <main>
      <h1>EdilSync unified test sessions</h1>
      <p>Each row groups every suite executed in the same run and links to the expandable HTML summary.</p>
      <table>
        <thead>
          <tr>
            <th>Session</th>
            <th>Status</th>
            <th>Started</th>
            <th>Runs</th>
            <th>Passed</th>
            <th>Failed</th>
            <th>Skipped</th>
          </tr>
        </thead>
        <tbody>
          ${sessions.map((session) => `
            <tr>
              <td><a href="./${escapeHtml(session.sessionId)}.html">${escapeHtml(session.sessionId)}</a></td>
              <td class="status-${escapeHtml(session.status)}">${escapeHtml(session.status)}</td>
              <td>${escapeHtml(session.startedAt)}</td>
              <td>${session.runCount}</td>
              <td>${session.passedRuns}</td>
              <td>${session.failedRuns}</td>
              <td>${session.skippedRuns}</td>
            </tr>`).join('') || '<tr><td colspan="7">No sessions recorded yet.</td></tr>'}
        </tbody>
      </table>
    </main>
  </body>
</html>`;

  writeFileSync(path.join(reportsRoot, 'index.html'), indexHtml);
}

const sessionId = process.argv.find((arg) => arg.startsWith('--sessionId='))?.slice('--sessionId='.length);

mkdirSync(reportsRoot, { recursive: true });
mkdirSync(dataRoot, { recursive: true });

if (sessionId) {
  renderSessionPage(sessionId);
}

renderIndexPage();