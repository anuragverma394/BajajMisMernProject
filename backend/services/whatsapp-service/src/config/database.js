const { getPool } = require('./sqlserver');

async function connectDatabase() {
  await getPool(process.env.DEFAULT_SEASON || '2526');
  console.log('Database connection ready');
}

module.exports = connectDatabase;
