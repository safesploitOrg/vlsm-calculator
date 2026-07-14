import {
  existsSync,
  readFileSync,
  readdirSync
} from 'node:fs';
import {
  dirname,
  extname,
  relative,
  resolve,
  sep
} from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = resolve(repositoryRoot, 'public');
const indexPath = resolve(publicRoot, 'index.html');
const errors = [];

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function publicPath(path) {
  return relative(repositoryRoot, path).split(sep).join('/');
}

function addError(message) {
  errors.push(message);
}

const html = readFileSync(indexPath, 'utf8');

if (!/^<!doctype html>/i.test(html.trimStart())) {
  addError('public/index.html must start with an HTML5 doctype.');
}
if (!/<html\s[^>]*lang="[^"]+"/i.test(html)) {
  addError('public/index.html must declare a document language.');
}
if (!/<meta\s[^>]*name="viewport"/i.test(html)) {
  addError('public/index.html must include a viewport meta element.');
}
if (!/<title>[^<]+<\/title>/i.test(html)) {
  addError('public/index.html must include a non-empty title.');
}
if (/<script(?![^>]*\ssrc=)[^>]*>/i.test(html)) {
  addError('Inline scripts are not permitted by the Content Security Policy.');
}

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if (duplicateIds.length > 0) {
  addError(`Duplicate HTML id values: ${duplicateIds.join(', ')}`);
}

for (const match of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
  const reference = match[1];
  if (/^(?:https?:|mailto:|#|data:)/i.test(reference)) {
    continue;
  }

  const assetPath = resolve(publicRoot, reference.split(/[?#]/, 1)[0]);
  if (assetPath !== publicRoot && !assetPath.startsWith(`${publicRoot}${sep}`)) {
    addError(`Asset reference escapes public/: ${reference}`);
  } else if (!existsSync(assetPath)) {
    addError(`Missing local asset referenced by HTML: ${reference}`);
  }
}

for (const scriptPath of listFiles(resolve(publicRoot, 'assets/js')).filter((path) => extname(path) === '.js')) {
  const source = readFileSync(scriptPath, 'utf8');
  const importPatterns = [
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\s+['"]([^'"]+)['"]/g
  ];

  for (const pattern of importPatterns) {
    for (const match of source.matchAll(pattern)) {
      if (!match[1].startsWith('.')) {
        continue;
      }
      const importedPath = resolve(dirname(scriptPath), match[1]);
      if (!existsSync(importedPath)) {
        addError(`${publicPath(scriptPath)} imports missing module ${match[1]}`);
      }
    }
  }
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`Static validation error: ${error}`));
  process.exitCode = 1;
} else {
  console.log('HTML structure, local assets, and JavaScript module references are valid.');
}
