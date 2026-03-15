const { executeQuery } = require('../core/db/query-executor');

function quoteSqlObjectName(name) {
  return String(name)
    .split('.')
    .map((part) => `[${part.replace(/]/g, ']]')}]`)
    .join('.');
}

async function getObjectId(tableName, season) {
  const rows = await executeQuery('SELECT OBJECT_ID(@tableName) AS objectId', { tableName }, season);
  return rows[0]?.objectId || null;
}

async function getMonthlyAggregate({ tableName, factoryCode, fromDate, toDate, columns, season }) {
  const selectList = columns.map((column) => `SUM(ISNULL(${column}, 0)) AS ${column}`).join(',\n');

  const rows = await executeQuery(
    `SELECT ${selectList}
     FROM ${quoteSqlObjectName(tableName)}
     WHERE (@factoryCode IS NULL OR D_Factory = @factoryCode)
       AND CAST(D_Date AS date) BETWEEN @fromDate AND @toDate`,
    {
      factoryCode: factoryCode || null,
      fromDate,
      toDate
    },
    season
  );

  return rows[0] || {};
}

module.exports = {
  getObjectId,
  getMonthlyAggregate
};
