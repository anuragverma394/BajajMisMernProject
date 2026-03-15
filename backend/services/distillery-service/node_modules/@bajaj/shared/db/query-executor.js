const createQueryExecutor = ({ query, scalar, procedure, withSeason }) => {
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

  return {
    executeQuery,
    executeScalar,
    executeProcedure,
    withSeason
  };
};

module.exports = { createQueryExecutor };
