import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';
import { logger } from './utils/logger.js';

async function startServer() {
  await connectDB();
  const app = createApp();
  const port = parseInt(ENV.PORT || '5000', 10);

  const server = app.listen(port, () => {
    logger.info(`🚀 Interview Management Server running on port ${port} [${ENV.NODE_ENV}]`);
    logger.info(`🔗 API Healthcheck available at: http://localhost:${port}/api/v1/health`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${port} is already in use by another process. Please close the existing process on port ${port} or change PORT in .env.`);
      process.exit(1);
    } else {
      logger.error('Server error:', err);
    }
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      logger.info('HTTP server closed.');
    });
  });
}

startServer().catch((err) => {
  logger.error('Fatal startup error:', err);
  process.exit(1);
});
