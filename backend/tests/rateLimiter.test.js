'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { aiRateLimiter, emailAuthRateLimiter } = require('../middleware/rateLimiter');

// ── helpers ───────────────────────────────────────────────────────────────────
function fakeReq(ip = '127.0.0.1', sub = null) {
  return { ip, user: sub ? { sub } : undefined };
}

function fakeRes() {
  const res = {
    _status: null,
    _body: null,
    status(code) { this._status = code; return this; },
    json(body) { this._body = body; return this; },
    end() { return this; },
  };
  return res;
}

// ── aiRateLimiter ─────────────────────────────────────────────────────────────
test('aiRateLimiter passes through requests within the limit', () => {
  const middleware = aiRateLimiter({ windowMs: 60_000, max: 5 });
  const req = fakeReq('10.0.0.1', 'user-test');
  let nextCalled = 0;
  for (let i = 0; i < 5; i++) {
    const res = fakeRes();
    middleware(req, res, () => { nextCalled++; });
  }
  assert.equal(nextCalled, 5);
});

test('aiRateLimiter returns 429 after exceeding the configured maximum', () => {
  const middleware = aiRateLimiter({ windowMs: 60_000, max: 3 });
  const req = fakeReq('10.0.0.2', 'user-limit');
  const responses = [];
  for (let i = 0; i < 5; i++) {
    const res = fakeRes();
    middleware(req, res, () => {});
    responses.push(res._status);
  }
  // Requests 4 and 5 should be blocked
  assert.ok(responses.includes(429));
  assert.equal(responses.filter(s => s === 429).length, 2);
});

test('aiRateLimiter uses req.ip as fallback when req.user.sub is absent', () => {
  const middleware = aiRateLimiter({ windowMs: 60_000, max: 2 });
  const req = fakeReq('10.0.0.3'); // no user.sub
  let blocked = false;
  for (let i = 0; i < 4; i++) {
    const res = fakeRes();
    middleware(req, res, () => {});
    if (res._status === 429) blocked = true;
  }
  assert.ok(blocked, 'Expected 429 after exceeding limit via ip fallback');
});

// ── emailAuthRateLimiter ──────────────────────────────────────────────────────
test('emailAuthRateLimiter passes through requests within the email limit', () => {
  const middleware = emailAuthRateLimiter({ windowMs: 60_000, max: 5 });
  const req = fakeReq('10.1.0.1');
  let nextCalled = 0;
  for (let i = 0; i < 5; i++) {
    middleware(req, fakeRes(), () => { nextCalled++; });
  }
  assert.equal(nextCalled, 5);
});

test('emailAuthRateLimiter returns 429 once the email limit is exceeded', () => {
  const middleware = emailAuthRateLimiter({ windowMs: 60_000, max: 4 });
  const req = fakeReq('10.1.0.2');
  const statuses = [];
  for (let i = 0; i < 6; i++) {
    const res = fakeRes();
    middleware(req, res, () => {});
    statuses.push(res._status);
  }
  assert.ok(statuses.includes(429), 'Expected at least one 429 response');
});

