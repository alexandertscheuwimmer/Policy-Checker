export async function onRequestPost(context) {
  const request = context.request;
  const body = await request.text();
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    return new Response('Invalid API key', { status: 401 });
  }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: body,
  });

  // Antwort UNGEPUFFERT durchreichen (Stream). Frueher wurde hier mit
  // `await upstream.text()` die komplette Antwort abgewartet – bei langem
  // adaptivem Denken (hoher/max. Aufwand) dauert das oft > 100 s, wodurch
  // Cloudflare die Verbindung mit Fehler 524 abbricht und eine Nicht-JSON-
  // Fehlerseite liefert. Durch das Durchreichen von upstream.body fliessen
  // sofort Bytes (message_start/ping/Delta-Events), die Verbindung bleibt
  // am Leben, und beliebig lange Antworten kommen vollstaendig an.
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
    },
  });
}
