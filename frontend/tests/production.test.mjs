import assert from 'node:assert/strict';
import test from 'node:test';
import axios, { AxiosError } from 'axios';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { createServer } from 'vite';

test('same-origin configuration and cookie-session recovery', async () => {
  const server = await createServer({
    envDir: false,
    server: { middlewareMode: true },
    define: {
      'import.meta.env.VITE_API_URL': '""',
      'import.meta.env.VITE_SIGNALR_URL': '""',
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': '""',
    },
  });
  const previousAdapter = axios.defaults.adapter;
  const previousWindow = globalThis.window;
  try {
    const constants = await server.ssrLoadModule('/src/utils/constants.ts');
    assert.equal(constants.API_URL, '/api');
    assert.equal(constants.SIGNALR_URL, '/hubs');
    assert.equal(constants.GOOGLE_CLIENT_ID, '');

    const { default: LoginPage } = await server.ssrLoadModule('/src/pages/Auth/LoginPage.tsx');
    const { store } = await server.ssrLoadModule('/src/store/index.ts');
    const loginHtml = renderToStaticMarkup(createElement(Provider, { store },
      createElement(MemoryRouter, null, createElement(LoginPage))));
    assert.match(loginHtml, /Đăng nhập Google chưa được cấu hình/);

    const { isOwnNewPost } = await server.ssrLoadModule('/src/hooks/useSignalR.tsx');
    assert.equal(isOwnNewPost({ actorId: 7 }, 7), true);
    assert.equal(isOwnNewPost({ actorId: 8 }, 7), false);
    assert.equal(isOwnNewPost(undefined, 7), false);
    assert.equal(isOwnNewPost({}, 7), false);
    assert.equal(isOwnNewPost(undefined, undefined), false);

    const { default: api } = await server.ssrLoadModule('/src/services/api.ts');
    assert.equal(api.defaults.withCredentials, true);
    let currentUrl = '/profile/alice';
    let redirects = 0;
    globalThis.window = { location: {
      get href() { return currentUrl; },
      set href(value) { currentUrl = value; redirects++; },
    } };
    let attempts = 0;
    let refreshes = 0;
    api.defaults.adapter = async (config) => {
      attempts++;
      if (!config._retry) {
        throw new AxiosError('Expired cookie', 'ERR_BAD_REQUEST', config, null, { status: 401 });
      }
      return { data: { id: 1 }, status: 200, headers: {}, config };
    };
    axios.defaults.adapter = async (config) => {
      refreshes++;
      assert.equal(config.url, '/api/v1/auth/refresh');
      assert.equal(config.withCredentials, true);
      return { data: {}, status: 200, headers: {}, config };
    };
    assert.equal((await api.get('v1/auth/me')).data.id, 1);
    assert.equal(attempts, 2);
    assert.equal(refreshes, 1);

    // A guest must be able to open the login page without a redirect/reload loop.
    currentUrl = '/login';
    axios.defaults.adapter = async (config) => {
      throw new AxiosError('No refresh cookie', 'ERR_BAD_REQUEST', config, null, { status: 400 });
    };
    await assert.rejects(api.get('v1/auth/me'));
    assert.equal(globalThis.window.location.href, '/login');
    assert.equal(redirects, 0);
  } finally {
    axios.defaults.adapter = previousAdapter;
    globalThis.window = previousWindow;
    await server.close();
  }
});
