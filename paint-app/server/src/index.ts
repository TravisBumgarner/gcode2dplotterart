import { createServer } from 'node:http';
import { loadConfig } from './config.js';
import { Hub } from './hub.js';
import { attachWebSocket, buildApp } from './server.js';

const VERSION = process.env.npm_package_version ?? '0.1.0';

const config = loadConfig();
const hub = new Hub({ serverVersion: VERSION, maxJobs: config.MAX_JOBS });
const app = buildApp({ hub, config, version: VERSION });
const server = createServer(app);
attachWebSocket(server, hub);

server.listen(config.PORT, config.HOST, () => {
  console.log(`plotter-server ${VERSION} listening on http://${config.HOST}:${config.PORT}`);
  if (config.CLIENT_DIR) console.log(`serving client from ${config.CLIENT_DIR}`);
});

/**
 * A container restart while the pen is down leaves ink on the page. Stopping
 * cleanly is the difference between a paused plot and a ruined one — so lift
 * the pen, drop the steppers, and let go of the port before exiting.
 */
let shuttingDown = false;
const shutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} — shutting down`);
  hub.dispose();
  if (hub.runner.isActive) hub.runner.abort('server shutting down');
  if (hub.connection.connected) {
    await hub.connection.sendMany(['G91', 'G0 Z5', 'G90', 'M84']).catch(() => {});
    await hub.connection.disconnect().catch(() => {});
  }
  server.close(() => process.exit(0));
  // Don't let a half-open socket hold the process past a container's grace.
  setTimeout(() => process.exit(0), 5000).unref();
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
