import { z } from 'zod';

const schema = z.object({
  /** 0 asks the OS for a free port, which is how the tests avoid collisions. */
  PORT: z.coerce.number().int().min(0).max(65535).default(8080),
  HOST: z.string().default('0.0.0.0'),
  /**
   * Where to serve the built paint-app renderer from, so the Pi hands out both
   * the UI and the API on one origin. Unset means API only.
   */
  CLIENT_DIR: z.string().optional(),
  /**
   * Defaults to `*`: this is a device on your LAN wired to a machine anyone
   * standing next to it can already unplug. Set it if the Pi is exposed.
   */
  CORS_ORIGIN: z.string().default('*'),
  MAX_JOBS: z.coerce.number().int().positive().default(20),
  /** Biggest job upload accepted, as an Express body-parser size. */
  MAX_UPLOAD: z.string().default('64mb'),
});

export type Config = z.infer<typeof schema>;

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid configuration:\n${issues}`);
  }
  return parsed.data;
};
