import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import express from 'express';

import authenticateRoutes from '../../backend/routes/shared/authenticate.js';

// POST /api/authenticate/token was bound to verifyToken, a boolean TOTP helper rather than a
// request handler: it never answered, so each request held its connection open until Node's
// request timeout, with no login needed. Nothing in the UI called it (2FA setup checks codes
// in the browser, and login checks the code itself), so the route is gone and the request
// now falls through to whatever follows the router.
test('POST /api/authenticate/token is answered at once, not left hanging', async () => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => { req.session = {}; next(); });
  app.use('/api/authenticate', authenticateRoutes);
  app.use((req, res) => { res.status(404).json({ error: 'Not handled by the router' }); });
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const res = await fetch('http://127.0.0.1:' + server.address().port + '/api/authenticate/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ authentication2FA: '123456' }),
      signal: AbortSignal.timeout(3000)
    });
    assert.equal(res.status, 404);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
