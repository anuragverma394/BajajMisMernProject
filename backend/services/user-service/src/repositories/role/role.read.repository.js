const { query } = require('../../core/db/mssql');

async function getRoles(filters, season) {
  const result = await query(
    `SELECT rl.R_Code, rl.R_Name, rl.MID, m.Modualname,
            CASE WHEN rl.RADD='1' THEN 'Yes' ELSE 'No' END AS RADD,
            CASE WHEN rl.RUPDATE='1' THEN 'Yes' ELSE 'No' END AS RUPDATE,
            CASE WHEN rl.RDELETE='1' THEN 'Yes' ELSE 'No' END AS RDELETE,
            CASE WHEN rl.RVIEW='1' THEN 'Yes' ELSE 'No' END AS RVIEW,
            CASE WHEN rl.REXPORT='1' THEN 'Yes' ELSE 'No' END AS REXPORT,
            CASE WHEN rl.RPRINT='1' THEN 'Yes' ELSE 'No' END AS RPRINT,
            CASE WHEN rl.RSEARCH='1' THEN 'Yes' ELSE 'No' END AS RSEARCH,
            CASE WHEN rl.RNotification='1' THEN 'Yes' ELSE 'No' END AS RNotification
     FROM MI_Roll rl
     JOIN MI_Modual m ON m.mid = rl.mid
     WHERE (@rollCode = '' OR rl.R_Code LIKE @rollCodeLike)
       AND (@rollName = '' OR rl.R_Name LIKE @rollNameLike)
     ORDER BY rl.RID ASC`,
    {
      rollCode: filters.rollCode || '',
      rollName: filters.rollName || '',
      rollCodeLike: `${filters.rollCode || ''}%`,
      rollNameLike: `${filters.rollName || ''}%`
    },
    season
  );
  return result.rows;
}

async function getRoleByCode(roleCode, season) {
  const result = await query(
    'SELECT TOP 1 R_Code, R_Name FROM MI_Roll WHERE R_Code=@roleCode',
    { roleCode },
    season
  );
  return result.rows[0] || null;
}

async function getRolePermissionProjection(roleCode, season) {
  const result = await query(
    `WITH my_cte AS (
       SELECT m.MID, Modualname, '0' RADD, '0' RUPDATE, '0' RDELETE, '0' RVIEW, '0' REXPORT, '0' RPRINT, '0' RSEARCH, '0' RNotification
       FROM MI_Modual m
       UNION ALL
       SELECT m.MID, Modualname, RADD, RUPDATE, RDELETE, RVIEW, REXPORT, RPRINT, RSEARCH, RNotification
       FROM MI_Modual m
       LEFT JOIN MI_Roll r ON m.MId = r.MID
       WHERE r.R_Code = @roleCode
     )
     SELECT DISTINCT MID, Modualname,
            MAX(RADD) RADD, MAX(RUPDATE) RUPDATE, MAX(RDELETE) RDELETE,
            MAX(RVIEW) RVIEW, MAX(REXPORT) REXPORT, MAX(RPRINT) RPRINT,
            MAX(RSEARCH) RSEARCH, MAX(RNotification) RNotification
     FROM my_cte
     GROUP BY MID, Modualname
     ORDER BY MID`,
    { roleCode },
    season
  );
  return result.rows;
}

async function getRoleModule(roleCode, moduleId, season) {
  const result = await query(
    'SELECT * FROM MI_Roll WHERE R_Code=@roleCode AND MID=@moduleId',
    { roleCode, moduleId },
    season
  );
  return result.rows;
}

async function getRoleDataSingle(userId, factId, season) {
  const result = await query(
    `SELECT DISTINCT
        r.R_Code,
        r.R_Name,
        CASE
          WHEN @userId = '0' THEN CAST(0 AS bit)
          WHEN EXISTS (
            SELECT 1
            FROM MI_UserRollAssign a
            WHERE a.userid = @userId
              AND a.factid = @factId
              AND a.R_Code = r.R_Code
          ) THEN CAST(1 AS bit)
          ELSE CAST(0 AS bit)
        END AS datavalue
     FROM MI_Roll r
     ORDER BY r.R_Code`,
    { userId, factId },
    season
  );
  return result.rows;
}

async function getRoleModuleData(userId, factId, roleCodes, season) {
  if (userId) {
    const result = await query(
      `SELECT etr.MID, m.Modualname, etr.RADD, etr.RUPDATE, etr.RDELETE, etr.RVIEW, etr.REXPORT, etr.RPRINT, etr.RSEARCH, etr.RNotification
       FROM MI_UserRollAssignExtra etr
       JOIN MI_Modual m ON etr.MID = m.MId
       WHERE etr.userid=@userId AND etr.factid=@factId`,
      { userId, factId },
      season
    );
    return result.rows;
  }

  if (!roleCodes.length) {
    const result = await query(
      `SELECT MID, Modualname, '0' RADD, '0' RUPDATE, '0' RDELETE, '0' RVIEW, '0' REXPORT, '0' RPRINT, '0' RSEARCH, '0' RNotification
       FROM MI_Modual`,
      {},
      season
    );
    return result.rows;
  }

  const params = {};
  const inSql = roleCodes.map((code, idx) => {
    params[`c_${idx}`] = code;
    return `@c_${idx}`;
  }).join(', ');

  const result = await query(
    `SELECT MID, Modualname, '0' RADD, '0' RUPDATE, '0' RDELETE, '0' RVIEW, '0' REXPORT, '0' RPRINT, '0' RSEARCH, '0' RNotification
     FROM MI_Modual
     WHERE MID NOT IN (SELECT MID FROM MI_Roll WHERE R_Code IN (${inSql}))`,
    params,
    season
  );
  return result.rows;
}

async function getRoleDetailData(roleCodes, season) {
  if (!roleCodes.length) return [];
  const params = {};
  const inSql = roleCodes.map((code, idx) => {
    params[`c_${idx}`] = code;
    return `@c_${idx}`;
  }).join(', ');

  const result = await query(
    `SELECT R_Code, R_Name, rl.MID, Modualname,
            CASE WHEN RADD='1' THEN 'Yes' ELSE 'No' END RADD,
            CASE WHEN RUPDATE='1' THEN 'Yes' ELSE 'No' END RUPDATE,
            CASE WHEN RDELETE='1' THEN 'Yes' ELSE 'No' END RDELETE,
            CASE WHEN RVIEW='1' THEN 'Yes' ELSE 'No' END RVIEW,
            CASE WHEN REXPORT='1' THEN 'Yes' ELSE 'No' END REXPORT,
            CASE WHEN RPRINT='1' THEN 'Yes' ELSE 'No' END RPRINT,
            CASE WHEN RSEARCH='1' THEN 'Yes' ELSE 'No' END RSEARCH,
            CASE WHEN RNotification='1' THEN 'Yes' ELSE 'No' END RNotification
     FROM MI_Roll rl
     JOIN MI_Modual m ON m.mid = rl.mid
     WHERE R_Code IN (${inSql})
     ORDER BY R_Code ASC`,
    params,
    season
  );
  return result.rows;
}

module.exports = {
  getRoles,
  getRoleByCode,
  getRolePermissionProjection,
  getRoleModule,
  getRoleDataSingle,
  getRoleModuleData,
  getRoleDetailData
};
