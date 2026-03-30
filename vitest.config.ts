import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['server/**/*.spec.ts'],
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['server/**/*.ts'],
      exclude: ['server/**/*.spec.ts', 'server/models/**']
    }
  },
  resolve: {
    alias: {
      // Handle ES module imports
    }
  }
});
