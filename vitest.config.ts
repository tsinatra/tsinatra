import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['test.setup.ts'],
    watch: false,
    passWithNoTests: true,
    silent: true,
  },
});
