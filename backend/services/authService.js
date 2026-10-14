const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendActivityEmail } = require('./emailService');
const supabase = require('./supabaseService');

const LOGIN_CODE_TTL_MS = 10 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

function signToken(user) {
  return jwt.sign({ sub: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function register({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const [existing] = await supabase.select('users', `${supabase.eq('email', normalizedEmail)}&select=id`);
  if (existing) throw loginError('An account with that email already exists.', 409);

  const passwordHash = await bcrypt.hash(password, 12);
  let row;
  try {
    row = await supabase.insert('users', {
      id: crypto.randomUUID(),
      username: name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      email_verified: false,
    });
  } catch (error) {
    if (error.code === '23505') throw loginError('An account with that email already exists.', 409);
    throw error;
  }
  if (!row) throw loginError('Could not create the account. Please try again.', 500);

  await startEmailLogin({ name: row.username, email: row.email });
  return { requiresVerification: true, email: normalizedEmail };
}

async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const [row] = await supabase.select('users', `${supabase.eq('email', normalizedEmail)}&select=*`);
  if (!row || !row.password_hash || !(await bcrypt.compare(password, row.password_hash))) {
    throw loginError('Invalid email or password.', 401);
  }
  if (!row.email_verified) {
    throw loginError('Verify your email with a sign-in code before using password login.', 403);
  }

  const user = mapUser(row);
  return { token: signToken(user), user };
}

async function startEmailLogin({ name, email }) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();
  const [account] = await supabase.select(
    'users',
    `${supabase.eq('email', normalizedEmail)}&select=id`
  );
  if (!account) {
    throw loginError('No account exists for this email. Create an account first.', 404);
  }

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  const codeHash = hashLoginCode(normalizedEmail, code);
  const expiresAt = new Date(Date.now() + LOGIN_CODE_TTL_MS).toISOString();

  await supabase.upsert('login_challenges', {
    id: normalizedEmail,
    email: normalizedEmail,
    name: normalizedName,
    code_hash: codeHash,
    expires_at: expiresAt,
    attempts: 0,
  });
  await sendActivityEmail(
    normalizedEmail,
    'Your Katha sign-in code',
    `Hi ${normalizedName}, your Katha sign-in code is ${code}. It expires in 10 minutes.`
  );
  return { requiresVerification: true, email: normalizedEmail };
}

async function verifyEmailLogin({ email, code }) {
  const normalizedEmail = email.trim().toLowerCase();
  const [challenge] = await supabase.select(
    'login_challenges',
    `${supabase.eq('id', normalizedEmail)}&select=id,email,name,code_hash,expires_at,attempts`
  );

  if (!challenge) throw loginError('The sign-in code is invalid or has expired.', 401);
  if (Date.parse(challenge.expires_at) <= Date.now()) {
    await removeLoginChallenge(normalizedEmail);
    throw loginError('The sign-in code has expired. Request a new one.', 401);
  }
  if (challenge.attempts >= MAX_LOGIN_ATTEMPTS) {
    await removeLoginChallenge(normalizedEmail);
    throw loginError('Too many incorrect codes. Request a new one.', 429);
  }

  const codeHash = hashLoginCode(normalizedEmail, code);
  const expectedHash = Buffer.from(challenge.code_hash, 'hex');
  const suppliedHash = Buffer.from(codeHash, 'hex');
  if (expectedHash.length !== suppliedHash.length || !crypto.timingSafeEqual(expectedHash, suppliedHash)) {
    const updated = await supabase.incrementLoginAttempts(
      normalizedEmail,
      challenge.attempts,
      challenge.attempts + 1
    );
    if (!updated) throw loginError('The sign-in code is invalid or has expired.', 401);
    if (challenge.attempts + 1 >= MAX_LOGIN_ATTEMPTS) {
      await removeLoginChallenge(normalizedEmail);
      throw loginError('Too many incorrect codes. Request a new one.', 429);
    }
    throw loginError('The sign-in code is incorrect.', 401);
  }

  const [existing] = await supabase.select('users', `${supabase.eq('email', normalizedEmail)}&select=*`);
  if (!existing) throw loginError('No account exists for this email. Create an account first.', 404);

  const consumed = await supabase.consumeLoginChallenge(normalizedEmail, challenge.code_hash);
  if (!consumed) throw loginError('The sign-in code is invalid or has expired.', 401);

  const row = await supabase.update('users', existing.id, {
    username: existing.username || challenge.name,
    email_verified: true,
    updated_at: new Date().toISOString(),
  });
  if (!row) throw loginError('Could not load the verified account after updating it.', 500);
  const user = mapUser(row);
  await sendActivityEmail(
    normalizedEmail,
    'Welcome to Katha',
    `Hi ${user.name}, your email has been confirmed and your Katha reading session is ready.`
  );
  return { token: signToken(user), user };
}

async function removeLoginChallenge(email) {
  await supabase.remove('login_challenges', email);
}

function hashLoginCode(email, code) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET)
    .update(`${email}:${code}`)
    .digest('hex');
}

function mapUser(row) {
  return {
    // Preserve email-based ownership from the existing OTP session tokens.
    _id: row.email,
    name: row.username,
    email: row.email,
    emailVerified: row.email_verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    preferences: { theme: 'sepia', readingMode: 'leisure', soundscape: 'none' },
  };
}

function loginError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { register, login, startEmailLogin, verifyEmailLogin };
