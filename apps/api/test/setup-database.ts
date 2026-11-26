import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

export function requireTestDatabaseUrl(value: string | undefined): string {
  if (!value) throw new Error('TEST_DATABASE_URL is required');
  const url = new URL(value);
  const database = decodeURIComponent(url.pathname.slice(1));
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !/^[a-zA-Z0-9_]+_test$/.test(database) ||
    (url.searchParams.has('schema') &&
      url.searchParams.get('schema') !== 'public')
  ) {
    throw new Error(
      'Tests require a separate database whose name ends in _test',
    );
  }
  return value;
}

export default function setupDatabase() {
  const root = fileURLToPath(new URL('../', import.meta.url));
  config({ path: `${root}.env`, quiet: true });
  const url = requireTestDatabaseUrl(process.env.TEST_DATABASE_URL);
  process.env.DATABASE_URL = url;
  execFileSync(
    process.execPath,
    [
      fileURLToPath(
        new URL('../../../node_modules/prisma/build/index.js', import.meta.url),
      ),
      'migrate',
      'deploy',
    ],
    { cwd: root, env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe' },
  );
}
