const { mssqlConnection } = require('@bajaj/shared');

async function connectDatabase() {
  await mssqlConnection.getConnectionPool({}, 'default');
}

module.exports = connectDatabase;
