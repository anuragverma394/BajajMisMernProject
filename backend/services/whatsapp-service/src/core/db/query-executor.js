const { query, scalar, procedure, withSeason } = require('./mssql');

async function executeQuery(sqlText, params = {}, season, options = {}) {
  const result = await query(sqlText, params, withSeason(season), options);
  return result.rows;
}

async function executeScalar(sqlText, params = {}, season, options = {}) {
  return scalar(sqlText, params, withSeason(season), options);
}

async function executeProcedure(name, params = {}, season, options = {}) {
  return procedure(name, params, withSeason(season), options);
}

module.exports = {
  executeQuery,
  executeScalar,
  executeProcedure,
  withSeason
};