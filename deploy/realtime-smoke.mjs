// Uses frontend's already installed SignalR client; run after `npm ci --prefix frontend`.
// Same SITE_URL/SMOKE_EMAIL/SMOKE_PASSWORD/SECOND_EMAIL/SECOND_PASSWORD as smoke.py.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(new URL('../frontend/package.json', import.meta.url));
const { HubConnectionBuilder, HttpTransportType, LogLevel } = require('@microsoft/signalr');
const sessions = [];
const hubs = [];
const manifest = { userIds: [], chatIds: [], messageIds: [], postIds: [], commentIds: [], mediaUrls: [] };

async function bounded(promise, label, timeout = 15000) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeout);
    })]);
  } finally { clearTimeout(timer); }
}

async function request(site, session, method, path, data) {
  const isForm = data instanceof FormData;
  const response = await fetch(site + path, {
    method, redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: { Cookie: session.cookie ?? '', ...(!isForm && { 'Content-Type': 'application/json' }) },
    body: data === undefined ? undefined : isForm ? data : JSON.stringify(data),
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
  const pending = bounded(new Promise(resolve => {
    hub.on(event, value => { if (predicate(value)) resolve(value); });
  }), event);
  // An HTTP trigger can fail before its event promise is awaited.
  pending.catch(() => {});
  return pending;
}

try {
  if (process.argv.includes('--self-test')) {
    assert.equal(typeof HubConnectionBuilder, 'function');
    assert.equal(typeof HttpTransportType.WebSockets, 'number');
    assert.equal(typeof FormData, 'function');
    console.log('PASS existing SignalR WebSocket runtime loads');
  } else {
    const site = new URL(process.env.SITE_URL);
    assert.ok(site.protocol === 'https:' && site.href === site.origin + '/',
      'SITE_URL must be a public HTTPS origin without credentials or query');
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
    for (const [name, session, label] of [['chat', recipient, 'recipient chat'],
      ['notifications', recipient, 'recipient notifications'], ['notifications', sender, 'author notifications']]) {
      const hub = new HubConnectionBuilder().withUrl(site.origin + '/hubs/' + name, {
        headers: { Cookie: session.cookie },
        transport: HttpTransportType.WebSockets, skipNegotiation: true,
      }).configureLogging(LogLevel.None).build();
      hubs.push(hub);
      await bounded(hub.start(), label + ' WSS connection');
      console.log(`PASS ${label} actual authenticated WSS handshake`);
    }
    const chat = await request(site.origin, sender, 'POST', '/api/v1/chat/direct/' + recipient.user.id);
    manifest.chatIds.push(chat.id);
    const marker = 'realtime-smoke-' + randomUUID();
    const messageEvent = waitFor(hubs[0], 'ReceiveMessage', message => message.content === marker && message.senderId === sender.user.id);
    const notificationEvent = waitFor(hubs[1], 'ReceiveNotification', notification =>
      notification.type === 'NewMessage' && notification.actorId === sender.user.id && notification.referenceId === chat.id);
    const events = Promise.all([messageEvent, notificationEvent]);
    events.catch(() => {});
    const message = await request(site.origin, sender, 'POST', '/api/v1/chat/message', { chatId: chat.id, content: marker });
    manifest.messageIds.push(message.id);
    const [received] = await events;
    assert.equal(received.id, message.id);
    console.log('PASS recipient received matching chat message over WSS');
    console.log('PASS recipient received matching notification over WSS');

    const newPostEvent = waitFor(hubs[1], 'NewPost', payload =>
      payload.actorId === sender.user.id && payload.postId > 0);
    const form = new FormData();
    form.append('Content', marker);
    form.append('AllowComment', 'true');
    const post = await request(site.origin, sender, 'POST', '/api/v1/posts', form);
    assert.ok(post.id > 0 && post.userId === sender.user.id, 'Created post belongs to synthetic author');
    manifest.postIds.push(post.id);
    manifest.mediaUrls.push(...post.images.map(image => image.imageUrl));
    const newPost = await newPostEvent;
    assert.equal(newPost.postId, post.id);
    assert.equal(newPost.actorId, sender.user.id);
    console.log('PASS recipient received matching NewPost over WSS');

    const likedEvent = waitFor(hubs[2], 'ReceiveNotification', notification =>
      notification.type === 'PostLiked' && notification.actorId === recipient.user.id && notification.referenceId === post.id);
    await request(site.origin, recipient, 'POST', `/api/v1/posts/${post.id}/like`);
    const liked = await likedEvent;
    assert.ok(liked.id > 0);
    assert.equal(liked.userId, sender.user.id);
    console.log('PASS author received matching PostLiked notification over WSS');

    const commentedEvent = waitFor(hubs[2], 'ReceiveNotification', notification =>
      notification.type === 'PostCommented' && notification.actorId === recipient.user.id && notification.referenceId === post.id);
    const comment = await request(site.origin, recipient, 'POST', `/api/v1/posts/${post.id}/comments`, { content: marker });
    manifest.commentIds.push(comment.data.id);
    const commented = await commentedEvent;
    assert.ok(commented.id > 0);
    assert.equal(commented.userId, sender.user.id);
    console.log('PASS author received matching PostCommented notification over WSS');
  }
} catch (error) {
  console.error('FAIL ' + error.message);
  process.exitCode = 1;
} finally {
  for (const hub of hubs) {
    try { await bounded(hub.stop(), 'WSS close', 5000); }
    catch { console.error('WARN WSS close timed out'); }
  }
  if (manifest.postIds.length) {
    const site = new URL(process.env.SITE_URL).origin;
    for (const commentId of manifest.commentIds) {
      try {
        await request(site, sessions[1], 'DELETE', `/api/v1/posts/${manifest.postIds[0]}/comments/${commentId}`);
        console.log('CLEAN synthetic comment ' + commentId);
      } catch { console.error('WARN synthetic comment cleanup failed'); }
    }
    for (const postId of manifest.postIds) {
      try {
        await request(site, sessions[0], 'DELETE', '/api/v1/posts/' + postId);
        console.log('CLEAN synthetic post ' + postId);
      } catch { console.error('WARN synthetic post cleanup failed'); }
    }
  }
  for (const session of sessions) {
    if (session.user) {
      try { await request(new URL(process.env.SITE_URL).origin, session, 'POST', '/api/v1/auth/logout'); }
      catch { console.error('WARN smoke session logout failed'); }
    }
  }
  if (manifest.userIds.length) console.log('CLEANUP_MANIFEST ' + JSON.stringify(manifest));
}
