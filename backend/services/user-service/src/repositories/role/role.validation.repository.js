const { query } = require('../../core/db/mssql');

async function roleExists(roleCode, season, options = {}) {
  const result = await query(
    'SELECT TOP 1 1 AS ok FROM MI_Roll WHERE R_Code=@roleCode',
    { roleCode },
    season,
    options
  );
  return !!result.rows.length;
}

module.exports = {
  roleExists
};
