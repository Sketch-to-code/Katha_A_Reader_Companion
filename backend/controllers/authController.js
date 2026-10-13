const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (
      typeof name !== 'string' || !name.trim() || name.trim().length > 100 ||
      typeof email !== 'string' || email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== 'string' || password.length < 8 || password.length > 200
    ) {
      return res.status(400).json({ error: 'A valid name, email, and password of 8-200 characters are required.' });
    }
    const result = await authService.register({ name, email, password });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (
      typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== 'string' || !password
    ) {
      return res.status(400).json({ error: 'A valid email and password are required.' });
    }
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function emailLogin(req, res, next) {
  try {
    const { name, email } = req.body;
    if (
      typeof name !== 'string' ||
      !name.trim() ||
      name.trim().length > 100 ||
      typeof email !== 'string' ||
      email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({ error: 'A valid email address and name are required.' });
    }
    const result = await authService.startEmailLogin({ name, email });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function verifyEmailLogin(req, res, next) {
  try {
    const { email, code } = req.body;
    if (
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof code !== 'string' ||
      !/^\d{6}$/.test(code)
    ) {
      return res.status(400).json({ error: 'A valid email address and six-digit sign-in code are required.' });
    }
    const result = await authService.verifyEmailLogin({ email, code });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name } = req.body;
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
      return res.status(400).json({ error: 'A valid name up to 100 characters is required.' });
    }
    const result = await authService.updateProfile({ email: req.user.email, name });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || !currentPassword) {
      return res.status(400).json({ error: 'Current password is required.' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 200) {
      return res.status(400).json({ error: 'New password must be between 8 and 200 characters.' });
    }
    const result = await authService.changePassword({
      email: req.user.email,
      currentPassword,
      newPassword,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  emailLogin,
  verifyEmailLogin,
  updateProfile,
  changePassword,
};
