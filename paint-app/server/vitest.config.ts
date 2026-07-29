import { defineConfig } from 'vitest/config';

// Without a config here, vitest climbs the tree and finds the renderer's
// `paint-app/vite.config.ts`, which pulls in React plugins this package has no
// reason to install. It only works locally because the parent's node_modules
// happens to be there.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
