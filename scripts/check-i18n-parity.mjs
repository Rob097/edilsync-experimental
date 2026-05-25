import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const workspaceRoot = process.cwd();
const i18nRoot = path.join(workspaceRoot, 'i18n');
const defaultBaseLocale = 'it';

const args = new Set(process.argv.slice(2));
const failOnEmptyString = args.has('--fail-on-empty-string');

function flattenStructure(value, currentPath = '', accumulator = new Map()) {
  const entryPath = currentPath || '<root>';

  if (Array.isArray(value)) {
    accumulator.set(entryPath, { type: 'array' });
    value.forEach((item, index) => {
      flattenStructure(item, `${currentPath}[${index}]`, accumulator);
    });
    return accumulator;
  }

  if (value && typeof value === 'object') {
    accumulator.set(entryPath, { type: 'object' });
    Object.entries(value).forEach(([key, nestedValue]) => {
      const nextPath = currentPath ? `${currentPath}.${key}` : key;
      flattenStructure(nestedValue, nextPath, accumulator);
    });
    return accumulator;
  }

  const valueType = value === null ? 'null' : typeof value;
  accumulator.set(entryPath, { type: valueType, value });
  return accumulator;
}

function formatIssue(locale, issue, keyPath, extra = '') {
  return `  - ${locale}: ${issue} at ${keyPath}${extra}`;
}

async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function getSliceLocales(slicePath) {
  const entries = await fs.readdir(slicePath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name.replace(/\.json$/, ''))
    .sort();
}

async function checkSlice(sliceName) {
  const slicePath = path.join(i18nRoot, sliceName);
  const locales = await getSliceLocales(slicePath);

  if (locales.length === 0) {
    return { sliceName, issues: [`- no locale files found in ${sliceName}`] };
  }

  const baseLocale = locales.includes(defaultBaseLocale) ? defaultBaseLocale : locales[0];
  const localeMaps = new Map();

  for (const locale of locales) {
    const json = await readJsonFile(path.join(slicePath, `${locale}.json`));
    localeMaps.set(locale, flattenStructure(json));
  }

  const baseMap = localeMaps.get(baseLocale);
  const issues = [];

  for (const locale of locales) {
    if (locale === baseLocale) {
      continue;
    }

    const localeMap = localeMaps.get(locale);

    for (const [keyPath, baseEntry] of baseMap.entries()) {
      if (!localeMap.has(keyPath)) {
        issues.push(formatIssue(locale, 'missing key', keyPath));
        continue;
      }

      const localeEntry = localeMap.get(keyPath);
      if (localeEntry.type !== baseEntry.type) {
        issues.push(formatIssue(locale, 'type mismatch', keyPath, ` (expected ${baseEntry.type}, got ${localeEntry.type})`));
        continue;
      }

      if (failOnEmptyString && baseEntry.type === 'string' && localeEntry.value === '') {
        issues.push(formatIssue(locale, 'empty string', keyPath));
      }
    }

    for (const keyPath of localeMap.keys()) {
      if (!baseMap.has(keyPath)) {
        issues.push(formatIssue(locale, 'extra key', keyPath));
      }
    }
  }

  return { sliceName, issues, locales, baseLocale };
}

async function main() {
  const entries = await fs.readdir(i18nRoot, { withFileTypes: true });
  const slices = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const results = [];

  for (const sliceName of slices) {
    results.push(await checkSlice(sliceName));
  }

  const failingResults = results.filter((result) => result.issues.length > 0);

  if (failingResults.length === 0) {
    console.log(`i18n parity OK across ${results.length} slice(s).`);
    results.forEach((result) => {
      console.log(`- ${result.sliceName}: ${result.locales.join(', ')} (base ${result.baseLocale})`);
    });
    return;
  }

  console.error('i18n parity check failed.');
  failingResults.forEach((result) => {
    console.error(`\n[${result.sliceName}]`);
    result.issues.forEach((issue) => console.error(issue));
  });
  process.exitCode = 1;
}

main().catch((error) => {
  console.error('Failed to run i18n parity check.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});