// Uses frontend's already installed SignalR client; run after `npm ci --prefix frontend`.
// Same SITE_URL/SMOKE_EMAIL/SMOKE_PASSWORD/SECOND_EMAIL/SECOND_PASSWORD as smoke.py.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(new URL('../frontend/package.json', import.meta.url));
const { HubConnectionBuilder, HttpTransportType, LogLevel } = require('@microsoft/signalr');
const sessions = [];
const hubs = [];
const manifest = { userIds: [], chatIds: [], messageIds: [] };

async function bounded(promise, label, timeout = 15000) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeout);
    })]);
  } finally { clearTimeout(timer); }
}

async function request(site, session, method, path, data) {
  const response = await fetch(site + path, {
    method, redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: { Cookie: session.cookie ?? '', 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  assert.ok(response.ok, `${method} ${path}: HTTP ${response.status}`);
  for (const header of response.headers.getSetCookie()) {
    const [name, ...value] = header.split(';')[0].split('=');
    session.cookies.set(name, value.join('='));
  }
  session.cookie = [...session.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
  return response.status === 204 ? undefined : response.json();
}

function waitFor(hub, event, predicate) {
  return bounded(new Promise(resolve => {
    hub.on(event, value => { if (predicate(value)) resolve(value); });
  }), event);
}

try {
  if (process.argv.includes('--self-test')) {
    assert.equal(typeof HubConnectionBuilder, 'function');
    assert.equal(typeof HttpTransportType.WebSockets, 'number');
    console.log('PASS existing SignalR WebSocket runtime loads');
  } else {
    const site = new URL(process.env.SITE_URL);
    assert.equal(site.protocol, 'https:');
    assert.equal(site.href, site.origin + '/');
    const credentials = [[process.env.SMOKE_EMAIL, process.env.SMOKE_PASSWORD],
      [process.env.SECOND_EMAIL, process.env.SECOND_PASSWORD]];
    for (const [email, password] of credentials) {
      assert.ok(email?.toLowerCase().endsWith('@example.invalid') && password,
        'Only reserved @example.invalid synthetic accounts are allowed');
      const session = { cookies: new Map() };
      sessions.push(session);
      await request(site.origin, session, 'POST', '/api/v1/auth/login', { usernameOrEmail: email, password });
      session.user = await request(site.origin, session, 'GET', '/api/v1/auth/me');
      assert.ok(session.user.userName.startsWith('instory_smoke_'), 'Account must be explicitly synthetic');
      assert.equal(session.user.email.toLowerCase(), email.toLowerCase());
    }
    const [sender, recipient] = sessions;
    assert.notEqual(sender.user.id, recipient.user.id);
    manifest.userIds = sessions.map(session => session.user.id);
    for (const name of ['chat', 'notifications']) {
      const hub = new HubConnectionBuilder().withUrl(site.origin + '/hubs/' + name, {
        headers: { Cookie: recipient.cookie },
        transport: HttpTransportType.WebSockets, skipNegotiation: true,
      }).configureLogging(LogLevel.None).build();
      hubs.push(hub);
      await bounded(hub.start(), name + ' WSS connection');
      console.log(`PASS ${name} actual authenticated WSS handshake`);
    }
    const chat = await request(site.origin, sender, 'POST', '/api/v1/chat/direct/' + recipient.user.id);
    manifest.chatIds.push(chat.id);
    const marker = 'realtime-smoke-' + randomUUID();
    const messageEvent = waitFor(hubs[0], 'ReceiveMessage', message => message.content === marker && message.senderId === sender.user.id);
    const notificationEvent = waitFor(hubs[1], 'ReceiveNotification', notification =>
      notification.type === 'NewMessage' && notification.actorId === sender.user.id && notification.referenceId === chat.id);
    // Attach both rejection handlers immediately, including if the HTTP send fails.
    const events = Promise.all([messageEvent, notificationEvent]);
    events.catch(() => {});
    const message = await request(site.origin, sender, 'POST', '/api/v1/chat/message', { chatId: chat.id, content: marker });
    manifest.messageIds.push(message.id);
    const [received] = await events;
    assert.equal(received.id, message.id);
    console.log('PASS recipient received matching chat message over WSS');
    console.log('PASS recipient received matching notification over WSS');
  }
} catch (error) {
  console.error('FAIL ' + error.message);
  process.exitCode = 1;
} finally {
  for (const hub of hubs) {
    try { await bounded(hub.stop(), 'WSS close', 5000); }
    catch { console.error('WARN WSS close timed out'); }
  }
  for (const session of sessions) {
    if (session.user) {
      try { await request(new URL(process.env.SITE_URL).origin, session, 'POST', '/api/v1/auth/logout'); }
      catch { console.error('WARN smoke session logout failed'); }
    }
  }
  if (manifest.userIds.length) console.log('CLEANUP_MANIFEST ' + JSON.stringify(manifest));
}
