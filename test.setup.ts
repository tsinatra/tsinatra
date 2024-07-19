import 'reflect-metadata';
import {afterEach, beforeEach, vi} from 'vitest';

beforeEach(() => {
  vi.stubEnv('LOG_LEVEL', 'SILENT');
  vi.stubEnv('METRICS_NAMESPACE', 'TSINATRA');
  vi.stubEnv('SST_REGION', 'us-east-2');
});

afterEach(() => {
  vi.unstubAllEnvs();
});
