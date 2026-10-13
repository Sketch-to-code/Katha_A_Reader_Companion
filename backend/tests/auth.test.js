const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const supabase = require('../services/supabaseService');
const authService = require('../services/authService');

function replace(object, replacements) {
  const originals = Object.fromEntries(
    Object.keys(replacements).map((key) => [key, object[key]])
  );
  Object.assign(object, replacements);
  return () => Object.assign(object, originals);
}

test('authService.login rejects incorrect password or non-existent user with 401', async () => {
  const restoreSupabase = replace(supabase, {
    select: async () => [], // No user found
  });

  try {
    await assert.rejects(
      async () => {
        await authService.login({ email: 'unknown@example.com', password: 'wrongpassword' });
      },
      (err) => {
        assert.equal(err.status, 401);
        assert.equal(err.message, 'Invalid email or password.');
        return true;
      }
    );
  } finally {
    restoreSupabase();
  }
});

test('authService.login rejects incorrect password for existing user with 401', async () => {
  const passwordHash = await bcrypt.hash('correctPassword123', 10);
  const restoreSupabase = replace(supabase, {
    select: async () => [
      {
        id: 'user-1',
        email: 'user@example.com',
        username: 'User One',
        password_hash: passwordHash,
        email_verified: true,
      },
    ],
  });

  try {
    await assert.rejects(
      async () => {
        await authService.login({ email: 'user@example.com', password: 'wrongPassword456' });
      },
      (err) => {
        assert.equal(err.status, 401);
        assert.equal(err.message, 'Invalid email or password.');
        return true;
      }
    );
  } finally {
    restoreSupabase();
  }
});

test('authService.login succeeds with correct password for verified user', async () => {
  process.env.JWT_SECRET = 'test-secret-at-least-32-chars-long-12345';
  const passwordHash = await bcrypt.hash('correctPassword123', 10);
  const restoreSupabase = replace(supabase, {
    select: async () => [
      {
        id: 'user-1',
        email: 'user@example.com',
        username: 'User One',
        password_hash: passwordHash,
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  });

  try {
    const result = await authService.login({ email: 'user@example.com', password: 'correctPassword123' });
    assert.ok(result.token);
    assert.equal(result.user.email, 'user@example.com');
    assert.equal(result.user.name, 'User One');
  } finally {
    restoreSupabase();
  }
});

test('authService.login auto-verifies and succeeds with correct password for unverified user', async () => {
  process.env.JWT_SECRET = 'test-secret-at-least-32-chars-long-12345';
  const passwordHash = await bcrypt.hash('correctPassword123', 10);
  let updatedRow = null;
  const restoreSupabase = replace(supabase, {
    select: async () => [
      {
        id: 'user-1',
        email: 'user@example.com',
        username: 'User One',
        password_hash: passwordHash,
        email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    update: async (_table, _id, fields) => {
      updatedRow = fields;
      return { id: 'user-1', email: 'user@example.com', ...fields };
    },
  });

  try {
    const result = await authService.login({ email: 'user@example.com', password: 'correctPassword123' });
    assert.ok(result.token);
    assert.equal(result.user.email, 'user@example.com');
    assert.equal(updatedRow?.email_verified, true);
  } finally {
    restoreSupabase();
  }
});

test('authService.register rejects existing verified email with 409', async () => {
  const restoreSupabase = replace(supabase, {
    select: async () => [{ id: 'existing-id', email_verified: true }],
  });

  try {
    await assert.rejects(
      async () => {
        await authService.register({ name: 'New User', email: 'existing@example.com', password: 'password123' });
      },
      (err) => {
        assert.equal(err.status, 409);
        assert.match(err.message, /already exists/);
        return true;
      }
    );
  } finally {
    restoreSupabase();
  }
});

test('authService.startEmailLogin provides sandbox fallback code when email delivery fails', async () => {
  process.env.JWT_SECRET = 'test-secret-at-least-32-chars-long-12345';
  let upsertedChallenge = null;
  const restoreSupabase = replace(supabase, {
    select: async () => [{ id: 'user-1' }],
    upsert: async (_table, data) => {
      upsertedChallenge = data;
      return data;
    },
  });

  try {
    const result = await authService.startEmailLogin({ name: 'Test User', email: 'external@example.com' });
    assert.equal(result.requiresVerification, true);
    assert.equal(result.email, 'external@example.com');
    // In test environment without valid resend domain, fallback code is generated
    assert.ok(result.code);
    assert.match(result.code, /^\d{6}$/);
    assert.ok(upsertedChallenge);
  } finally {
    restoreSupabase();
  }
});

