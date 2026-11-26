export function validateEnvironment(environment: Record<string, unknown>) {
  for (const name of [
    'DATABASE_URL',
    'JWT_SECRET',
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'WEB_URL',
    'CORS_ORIGIN',
  ]) {
    if (typeof environment[name] !== 'string' || !environment[name].trim()) {
      throw new Error(`${name} is required`);
    }
  }
  for (const name of ['WEB_URL', 'CORS_ORIGIN']) {
    const url = new URL(environment[name] as string);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error(`${name} must be an HTTP URL`);
  }
  const database = new URL(environment.DATABASE_URL as string);
  if (!['postgres:', 'postgresql:'].includes(database.protocol))
    throw new Error('DATABASE_URL must be a PostgreSQL URL');
  return environment;
}
