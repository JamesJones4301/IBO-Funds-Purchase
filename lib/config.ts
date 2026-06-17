export function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error('Missing environment variable: ' + name);
  }
  return value;
}

export function getBaseUrl() {
  const value = getRequiredEnv('NEXT_PUBLIC_BASE_URL');
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function getConnectorUrl() {
  return getRequiredEnv('APPS_SCRIPT_URL');
}

export function getConnectorKey() {
  return getRequiredEnv('IBO_CONNECTOR_KEY');
}
