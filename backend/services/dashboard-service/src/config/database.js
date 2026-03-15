const { getConnectionPool, getLogger } = require('@bajaj/shared');

const logger = getLogger('dashboard-service');

async function connectDatabase() {
  try {
    await getConnectionPool();
    logger.info('Database connection ready');
  } catch (error) {
    logger.error('Failed to connect to database', { error: error.message });
    throw error;
  }
}

module.exports = connectDatabase;
