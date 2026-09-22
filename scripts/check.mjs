import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const [html, readme, configText] = await Promise.all(['index.html', 'README.md', 'vercel.json'].map(file => readFile(file, 'utf8')));
const requireText = (text, markers, label) => {
  for (const marker of markers) if (!text.includes(marker)) throw new Error(`${label} missing: ${marker}`);
};
requireText(html, ['NOT_ACQUIRED', 'UNVERIFIED', 'NOT_RUN', 'HISTORICAL_REVIEW', 'BLOCKED_SOURCE', '24,562.5%', 'usage-boundary', 'noindex'], 'Public page');
requireText(readme, ['# 공개 거래내역 검증 노트', 'dataset_status: "NOT_ACQUIRED"', 'purpose: "historical_review"', '자동매매 알고리즘 학습'], 'Verification guide');
if (/<style\b|\sstyle\s*=|\son[a-z]+\s*=/i.test(html)) throw new Error('Inline styles/events conflict with the static CSP');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
if (!scripts.length) throw new Error('Missing progressive enhancement script');
for (const [, attributes, body] of scripts) {
  const src = attributes.match(/\bsrc="([^"]+)"/);
  if (!src || body.trim()) throw new Error('Only local external scripts are allowed');
  const filename = localFile(src[1]);
  new vm.Script(await readFile(filename, 'utf8'), { filename });
}
function localFile(url) {
  if (!/^\/?assets\/[a-zA-Z0-9_./-]+$/.test(url) || url.includes('..')) throw new Error(`Unsafe local asset path: ${url}`);
  return path.resolve(url.replace(/^\//, ''));
}
const assets = [...html.matchAll(/(?:href|src)="(\/?assets\/[^"?#]+)"/g)].map(match => match[1]);
for (const asset of assets) await access(localFile(asset));
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs');
for (const [, anchor] of html.matchAll(/href="#([^"]+)"/g)) if (!ids.includes(anchor)) throw new Error(`Broken local anchor: ${anchor}`);
const config = JSON.parse(configText);
if (config.outputDirectory !== 'dist' || config.buildCommand !== 'npm run build') throw new Error('Vercel config mismatch');
const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key, value]));
requireText(headers['Content-Security-Policy'] || '', ["script-src 'self'", "connect-src 'none'", "frame-ancestors 'none'"], 'CSP');
requireText(headers['X-Robots-Tag'] || '', ['noindex'], 'Release indexing policy');
console.log(`Static checks passed: honest states, research guide, ${scripts.length} script, ${assets.length} asset references, anchors and security headers.`);
