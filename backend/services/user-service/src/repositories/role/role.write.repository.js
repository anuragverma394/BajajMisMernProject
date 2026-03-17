const { query } = require('../../core/db/mssql');

function buildBulkInsert(tableName, columns, rows, keyPrefix) {
  if (!rows.length) return null;
  const params = {};
  const valuesSql = rows.map((row, rowIndex) => {
    const placeholders = columns.map((col, colIndex) => {
      const key = `${keyPrefix}_${rowIndex}_${colIndex}`;
      params[key] = row[col];
      return `@${key}`;
    });
    return `(${placeholders.join(', ')})`;
  }).join(',\n');

  return {
    sqlText: `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${valuesSql};`,
    params
  };
}

async function replaceRolePermissions(roleCode, roleName, permissions, season, options = {}) {
  await query(
    'DELETE FROM MI_Roll WHERE R_Code=@roleCode',
    { roleCode },
    season,
    options
  );

  if (!permissions.length) return;

  const rows = permissions.map((row) => ({
    R_Code: roleCode,
    R_Name: roleName,
    MID: row.MID,
    RADD: row.RADD,
    RUPDATE: row.RUPDATE,
    RDELETE: row.RDELETE,
    RVIEW: row.RVIEW,
    REXPORT: row.REXPORT,
    RPRINT: row.RPRINT,
    RSEARCH: row.RSEARCH,
    RNotification: row.RNotification
  }));

  const batch = buildBulkInsert(
    'MI_Roll',
    ['R_Code', 'R_Name', 'MID', 'RADD', 'RUPDATE', 'RDELETE', 'RVIEW', 'REXPORT', 'RPRINT', 'RSEARCH', 'RNotification'],
    rows,
    'role'
  );
  await query(batch.sqlText, batch.params, season, options);
}

module.exports = {
  replaceRolePermissions
};
