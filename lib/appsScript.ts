import { getBaseUrl, getConnectorKey, getConnectorUrl } from './config';

export type ConnectorResponse<T = unknown> = {
  ok: boolean;
  error?: string;
  data?: T;
};

export async function callConnector<T>(action: string, payload: Record<string, unknown>) {
  const response = await fetch(getConnectorUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      key: getConnectorKey(),
      action,
      baseUrl: getBaseUrl(),
      ...payload
    }),
    cache: 'no-store'
  });

  const text = await response.text();
  let parsed: ConnectorResponse<T>;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Apps Script returned a non JSON response: ' + text.slice(0, 200));
  }

  if (!response.ok || !parsed.ok) {
    throw new Error(parsed.error || 'Apps Script request failed.');
  }

  return parsed.data as T;
}
