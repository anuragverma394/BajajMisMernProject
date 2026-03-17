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

async function replaceUserRights(payload, season, options = {}) {
  const { userCode, units, roleCodes, extras } = payload;

  const deleteParams = { userCode };
  const unitInSql = units.map((code, idx) => {
    const key = `unit_${idx}`;
    deleteParams[key] = code;
    return `@${key}`;
  }).join(', ');

  await query(
    `DELETE FROM MI_UserRollAssign
     WHERE UserID = @userCode
       AND FactID IN (${unitInSql})`,
    deleteParams,
    season,
    options
  );

  await query(
    `DELETE FROM MI_UserRollAssignExtra
     WHERE UserID = @userCode
       AND FactID IN (${unitInSql})`,
    deleteParams,
    season,
    options
  );

  if (roleCodes.length) {
    const roleRows = [];
    units.forEach((factId) => {
      roleCodes.forEach((roleCode) => {
        roleRows.push({
          UserID: userCode,
          FactID: factId,
          R_Code: roleCode
        });
      });
    });
    const roleInsert = buildBulkInsert('MI_UserRollAssign', ['UserID', 'FactID', 'R_Code'], roleRows, 'ura');
    await query(roleInsert.sqlText, roleInsert.params, season, options);
  }

  if (extras.length) {
    const extraRows = [];
    units.forEach((factId) => {
      extras.forEach((item) => {
        extraRows.push({
          UserID: userCode,
          FactID: factId,
          MID: item.MID,
          RADD: item.RADD,
          RUPDATE: item.RUPDATE,
          RDELETE: item.RDELETE,
          RVIEW: item.RVIEW,
          REXPORT: item.REXPORT,
          RPRINT: item.RPRINT,
          RSEARCH: item.RSEARCH,
          RNotification: item.RNotification
        });
      });
    });
    const extraInsert = buildBulkInsert(
      'MI_UserRollAssignExtra',
      ['UserID', 'FactID', 'MID', 'RADD', 'RUPDATE', 'RDELETE', 'RVIEW', 'REXPORT', 'RPRINT', 'RSEARCH', 'RNotification'],
      extraRows,
      'urae'
    );
    await query(extraInsert.sqlText, extraInsert.params, season, options);
  }
}

module.exports = {
  replaceUserRights
};
