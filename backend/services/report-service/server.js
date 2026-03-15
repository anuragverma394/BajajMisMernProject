const { initialize, shutdown, getLogger, config } = require('@bajaj/shared');

const app = require('./app');
const connectDatabase = require('./src/config/database');
const logger = getLogger('report-service');

async function bootstrap() {
  try {
    await initialize('report-service');
    
    if (String(process.env.SKIP_DB_CONNECT || 'false').toLowerCase() !== 'true') {
      await connectDatabase();
    }

    const port = config.SERVICE_PORT || 5004;
    app.listen(port, () => {
      logger.info('report-service started', { port });
    });
  } catch (error) {
    logger.error('report-service failed to start', { error: error.message });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down');
  await shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down');
  await shutdown();
  process.exit(0);
});

bootstrap();
