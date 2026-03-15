const { query: runQuery, scalar: runScalar, withSeason } = require('./mssql');

async function query(sqlText, params = {}, season, options = {}) {
  const result = await runQuery(sqlText, params, withSeason(season), options);
  return result.rows;
}

async function scalar(sqlText, params = {}, season, options = {}) {
  return runScalar(sqlText, params, withSeason(season), options);
}

async function procedure() {
  throw new Error('Stored procedure executor is not enabled in query-executor. Use repository-level mssql.query.');
}

module.exports = {
  query,
  scalar,
  procedure,
  withSeason
};
