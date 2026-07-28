// Dev runner for the desktop build: starts the Vite dev server, then launches
// Electron pointed at it so the renderer keeps HMR. Doing it in one process
// (rather than `concurrently` + `wait-on`) means the Electron window never
// races ahead of the server, and quitting the app tears the server down.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import electron from 'electron';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts') });
await server.listen();

const url = server.resolvedUrls?.local?.[0];
if (!url) {
  await server.close();
  throw new Error('Vite dev server started without a local URL.');
}
server.printUrls();

const child = spawn(electron, ['.'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, VITE_DEV_SERVER_URL: url },
});

const shutdown = async (code) => {
  await server.close().catch(() => {});
  process.exit(code ?? 0);
};

child.on('close', (code) => shutdown(code ?? 0));
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
