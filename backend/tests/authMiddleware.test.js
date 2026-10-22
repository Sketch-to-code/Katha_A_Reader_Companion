'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../middleware/auth');

const SECRET = 'test-secret-at-least-32-chars-long-12345';

function fakeReq({ token } = {}) {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  };
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

test('requireAuth passes a valid JWT and populates req.user', () => {
  process.env.JWT_SECRET = SECRET;
  const token = jwt.sign({ sub: 'user@test.com', email: 'user@test.com' }, SECRET);
  const req = fakeReq({ token });
  const res = fakeRes();
  let nextCalled = false;
  requireAuth(req, res, () => { nextCalled = true; });
  assert.ok(nextCalled, 'next() should have been called');
  assert.ok(req.user, 'req.user should be populated');
  assert.equal(req.user.email, 'user@test.com');
});

test('requireAuth returns 401 when no Bearer token is provided', () => {
  process.env.JWT_SECRET = SECRET;
  const req = fakeReq(); // no token
  const res = fakeRes();
  requireAuth(req, res, () => assert.fail('next() should not be called'));
  assert.equal(res._status, 401);
  assert.match(res._body.error, /Missing bearer token/);
});

test('requireAuth returns 401 for a tampered or invalid token', () => {
  process.env.JWT_SECRET = SECRET;
  const req = fakeReq({ token: 'not-a-real-jwt' });
  const res = fakeRes();
  requireAuth(req, res, () => assert.fail('next() should not be called'));
  assert.equal(res._status, 401);
});

test('requireAuth returns 401 for an expired JWT', () => {
  process.env.JWT_SECRET = SECRET;
  const expired = jwt.sign({ sub: 'u@t.com', email: 'u@t.com' }, SECRET, { expiresIn: -1 });
  const req = fakeReq({ token: expired });
  const res = fakeRes();
  requireAuth(req, res, () => assert.fail('next() should not be called'));
  assert.equal(res._status, 401);
});

test('requireAuth returns 401 when JWT is signed with the wrong secret', () => {
  process.env.JWT_SECRET = SECRET;
  const wrongSecret = jwt.sign({ sub: 'u@t.com', email: 'u@t.com' }, 'wrong-secret-aaaaaaaaaaaaaaaa');
  const req = fakeReq({ token: wrongSecret });
  const res = fakeRes();
  requireAuth(req, res, () => assert.fail('next() should not be called'));
  assert.equal(res._status, 401);
});

test('requireAuth returns 503 when JWT_SECRET is too short', () => {
  process.env.JWT_SECRET = 'short';
  const req = fakeReq({ token: 'any-token' });
  const res = fakeRes();
  requireAuth(req, res, () => assert.fail('next() should not be called'));
  assert.equal(res._status, 503);
  process.env.JWT_SECRET = SECRET; // restore
});

test('requireAuth returns 401 for a token missing sub or email claims', () => {
  process.env.JWT_SECRET = SECRET;
  const noSubToken = jwt.sign({ data: 'no-sub-or-email' }, SECRET);
  const req = fakeReq({ token: noSubToken });
  const res = fakeRes();
  requireAuth(req, res, () => assert.fail('next() should not be called'));
  assert.equal(res._status, 401);
});

