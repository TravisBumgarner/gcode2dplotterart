#!/usr/bin/env node
/**
 * Cut a release of the plotter server.
 *
 *   npm run release -- 0.2.0
 *
 * Bumps package.json, commits, and pushes a `plotter-server-v*` tag. The tag is
 * what the GHCR workflow watches; the prefix keeps server releases from
 * colliding with any other versioning in this repo.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.join(dir, '..', 'package.json');

const run = (cmd, args) =>
  execFileSync(cmd, args, { stdio: 'inherit', cwd: path.dirname(pkgPath) });
const capture = (cmd, args) =>
  execFileSync(cmd, args, { encoding: 'utf8', cwd: path.dirname(pkgPath) }).trim();

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) {
  console.error('Usage: npm run release -- <major.minor.patch>');
  process.exit(1);
}

if (capture('git', ['status', '--porcelain'])) {
  console.error('Working tree is dirty. Commit or stash first.');
  process.exit(1);
}

const tag = `plotter-server-v${version}`;
if (capture('git', ['tag', '--list', tag])) {
  console.error(`Tag ${tag} already exists.`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.version = version;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

run('git', ['add', pkgPath]);
run('git', ['commit', '-m', `plotter-server: release ${version}`]);
run('git', ['tag', '-a', tag, '-m', `plotter-server ${version}`]);
run('git', ['push', 'origin', 'HEAD', tag]);

console.log(
  `\nPushed ${tag}. GHCR build: https://github.com/TravisBumgarner/gcode2dplotterart/actions`,
);
