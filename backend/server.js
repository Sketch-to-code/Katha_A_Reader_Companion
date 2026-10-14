require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./db/connection');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'Katha backend',
    message: 'API is running. Use /health or /api endpoints.',
    endpoints: ['/health', '/api/documents', '/api/auth']
  });
});

app.get('/health', async (_req, res, next) => {
  try {
    const { error } = await db.getClient().from('documents').select('id').limit(0);
    if (error) throw new Error(`Supabase health check failed: ${error.message}`);
    res.json({ ok: true, database: 'connected' });
  } catch (err) {
    next(err);
  }
});
app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: 'Not found',
    path: req.originalUrl,
    message: 'Katha backend is running. Try /health or an /api route.'
  });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT || 8081);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('PORT must be a valid TCP port between 1 and 65535.');
}

async function start() {
  await db.connect();
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT);
    server.once('listening', () => {
      console.log(`[katha-backend] listening on http://localhost:${PORT}`);
      resolve(server);
    });
    server.once('error', reject);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error(`[katha-backend] startup failed: ${err.message}`);
    process.exitCode = 1;
  });
}

module.exports = { app, start };
