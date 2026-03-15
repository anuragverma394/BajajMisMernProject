const { query, scalar } = require('../core/db/mssql');
let otpColumnCache;

function quoteIdentifier(name) {
  return `[${String(name || '').replace(/]/g, ']]')}]`;
}

async function resolveOtpColumn(season) {
  if (typeof otpColumnCache !== 'undefined') return otpColumnCache;

  const result = await query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_NAME = 'MI_User'
       AND COLUMN_NAME IN ('mobileOTP', 'MobileOTP', 'OTP', 'Otp', 'Mobile_Otp', 'OTPCode', 'OneTimePassword')`,
    {},
    season
  );

  const preferredOrder = [
    'mobileOTP',
    'MobileOTP',
    'OTP',
    'Otp',
    'Mobile_Otp',
    'OTPCode',
    'OneTimePassword'
  ];

  const found = new Set((result.rows || []).map((r) => String(r.COLUMN_NAME || r.column_name || '').trim()));
  otpColumnCache = preferredOrder.find((col) => found.has(col)) || null;
  return otpColumnCache;
}

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

async function getUserTypes(season) {
  const result = await query(
    `SELECT UTID, UT_UserType
     FROM MI_UserType
     ORDER BY UTID ASC`,
    {},
    season
  );
  return result.rows;
}

async function getUsers(filters, season) {
  const otpColumn = await resolveOtpColumn(season);
  const otpSelectSql = otpColumn
    ? `u.${quoteIdentifier(otpColumn)} AS mobileOTP`
    : `CAST(NULL AS varchar(50)) AS mobileOTP`;

  const where = [];
  const params = {};

  if (filters.id) {
    where.push('u.ID = @id');
    params.id = filters.id;
  }
  if (filters.unit) {
    where.push('uf.FactID = @unit');
    params.unit = filters.unit;
  }
  if (filters.userType) {
    where.push('u.UTID = @userType');
    params.userType = filters.userType;
  }
  if (filters.userId) {
    where.push('u.Userid LIKE @userIdLike');
    params.userIdLike = `${filters.userId}%`;
  }

  const whereSql = where.length ? `AND ${where.join(' AND ')}` : '';
  const result = await query(
    `SELECT u.ID, u.Userid, u.Name, u.Status, u.UTID, ut.UT_UserType AS UserTypeName, u.SAPCode,
          u.Mobile, u.EmailID, CONVERT(varchar, u.DOB, 23) AS DOB, u.Gender,
          u.Type, u.GPS_FLG AS GPS_Notification, u.TimeFrom, u.TimeTo,
          ${otpSelectSql},
          uf.FactID, f.F_Name
          FROM MI_User u
          LEFT JOIN MI_UserType ut ON ut.UTID = u.UTID
          LEFT JOIN MI_UserFact uf ON uf.UserID = u.Userid
          LEFT JOIN Factory f ON f.f_code = uf.FactID
          WHERE 1=1
       ${whereSql}
     ORDER BY u.ID ASC`,
    params,
    season
  );

  return result.rows;
}

async function getUserByUserId(userId, season, options = {}) {
  const value = await query(
    `SELECT TOP 1 ID, Userid, Password
     FROM MI_User
     WHERE Userid = @userId`,
    { userId },
    season,
    options
  );
  return value.rows[0] || null;
}

async function createUser(payload, season, options = {}) {
  const result = await query(
    `INSERT INTO MI_User(Userid, Name, Password, Status, UTID, FactID, SAPCode, Mobile, EmailID, DOB, Gender, Type, GPS_FLG, TimeFrom, TimeTo)
     VALUES(@Userid, @Name, @Password, @Status, @UTID, @FactID, @SAPCode, @Mobile, @EmailID,
     CASE WHEN @DOB='' THEN NULL ELSE @DOB END, @Gender, @Type, @GPS_Notification, @TimeFrom, @TimeTo);
     SELECT SCOPE_IDENTITY() AS ID;`,
    {
      Userid: payload.Userid,
      Name: payload.Name,
      Password: payload.Password,
      Status: payload.Status || '1',
      UTID: payload.UTID,
      FactID: '', // Always empty string
      SAPCode: payload.SAPCode || '',
      Mobile: payload.Mobile || '',
      EmailID: payload.EmailID || '',
      DOB: payload.DOB || '',
      Gender: payload.Gender || '1',
      Type: payload.Type || 'Other',
      GPS_Notification: payload.GPS_Notification || 0,
      TimeFrom: payload.TimeFrom || '0600',
      TimeTo: payload.TimeTo || '1800'
    },
    season,
    options
  );

  const id = result.rows?.[0]?.ID;
  if (!id) {
    throw new Error('Failed to insert user - no ID returned from database');
  }

  return Number(id);
}

async function updateUser(payload, season, options = {}) {
  await query(
    `UPDATE MI_User
     SET Userid=@Userid, Name=@Name, Password=@Password, Status=@Status, UTID=@UTID,
     FactID=@FactID, SAPCode=@SAPCode, Mobile=@Mobile, EmailID=@EmailID,
     DOB=CASE WHEN @DOB='' THEN NULL ELSE @DOB END, Gender=@Gender, Type=@Type,
     GPS_FLG=@GPS_Notification, TimeFrom=@TimeFrom, TimeTo=@TimeTo
     WHERE ID=@ID`,
    {
      ID: payload.ID,
      Userid: payload.Userid,
      Name: payload.Name,
      Password: payload.Password,
      Status: payload.Status || '1',
      UTID: payload.UTID,
      FactID: '', // Always empty string
      SAPCode: payload.SAPCode || '',
      Mobile: payload.Mobile || '',
      EmailID: payload.EmailID || '',
      DOB: payload.DOB || '',
      Gender: payload.Gender || '1',
      Type: payload.Type || 'Other',
      GPS_Notification: payload.GPS_Notification || 0,
      TimeFrom: payload.TimeFrom || '0600',
      TimeTo: payload.TimeTo || '1800'
    },
    season,
    options
  );
}

async function replaceUserFactories(userId, factories, season, options = {}) {
  try {
    await query('DELETE FROM MI_UserFact WHERE UserID=@userId', { userId }, season, options);

    if (!Array.isArray(factories) || !factories.length) {
      return;
    }

    const rows = factories
      .map((factId) => ({ UserID: String(userId).trim(), FactID: String(factId).trim() }))
      .filter((row) => row.UserID && row.FactID);

    if (!rows.length) return;

    const batch = buildBulkInsert('MI_UserFact', ['UserID', 'FactID'], rows, 'fact');
    if (batch && batch.sqlText) {
      await query(batch.sqlText, batch.params, season, options);
    }
  } catch (error) {
    console.error('[replaceUserFactories] Error:', error.message, { userId, factoryCount: factories?.length });
    throw error;
  }
}

async function replaceUserSeasons(userId, seasons, season, options = {}) {
  // Season mapping skipped locally as the central mapping table does not exist.
  return Promise.resolve();
}

async function getAssignedFactories(userId, season) {
  const result = await query(
    'SELECT FactID FROM MI_UserFact WHERE UserID=@userId',
    { userId },
    season
  );
  return result.rows;
}

async function getAssignedSeasons(userId, season) {
  // Season mapping table not found in local database schema.
  return [];
}

async function getUsersByFactory(factId, season) {
  const result = await query(
    `SELECT DISTINCT Userid, Name
     FROM MI_User
     WHERE UTID <> 1
       AND UserID IN (SELECT UserID FROM MI_UserFact WHERE FactID=@factId)
     ORDER BY Name`,
    { factId },
    season
  );
  return result.rows;
}

async function getUserName(userId, season) {
  return scalar(
    'SELECT TOP 1 Name FROM MI_User WHERE Userid=@userId',
    { userId },
    season
  );
}

async function getUserFactoriesWithName(userId, season) {
  const result = await query(
    `SELECT f_Code, f_Name + ' (' + F_Short + ')' AS F_Name
     FROM MI_Factory
     WHERE f_code IN (SELECT FactID FROM MI_UserFact WHERE UserID=@userId)`,
    { userId },
    season
  );
  return result.rows;
}

async function deleteUser(id, userId, season) {
  await query(
    'DELETE FROM MI_User WHERE ID=@id AND Userid=@userId',
    { id, userId },
    season
  );
}

async function getUserFactData(factId, season) {
  const hasFactFilter = String(factId || '').trim() !== '';
  const result = await query(
    `SELECT m.UserID, m.FactID, m.LNFlag, u.Name, m.UFID
     FROM MI_UserFact m
     JOIN MI_User u ON u.Userid = m.UserID
     WHERE (@hasFactFilter = 0 OR m.factid = @factId)`,
    { hasFactFilter: hasFactFilter ? 1 : 0, factId: hasFactFilter ? factId : null },
    season
  );
  return result.rows;
}


async function updateLabNotificationFlags(items, season, options = {}) {
  if (!items.length) return 0;
  const ids = items.map((x) => Number(x.UFID)).filter((x) => Number.isFinite(x) && x > 0);
  if (!ids.length) return 0;

  const params = {};
  const whenSql = items.map((row, idx) => {
    const idKey = `id_${idx}`;
    const flagKey = `flag_${idx}`;
    params[idKey] = Number(row.UFID);
    params[flagKey] = Number(row.LNFlag ? 1 : 0);
    return `WHEN UFID = @${idKey} THEN @${flagKey}`;
  }).join('\n');


  const inSql = items.map((_, idx) => `@id_${idx}`).join(', ');
  const result = await query(
    `UPDATE MI_UserFact
            SET LNFlag = CASE
            ${whenSql}
            ELSE LNFlag
            END
            WHERE UFID IN (${inSql});`,
    params,
    season,
    options
  );
  return result.rowsAffected.reduce((a, b) => a + b, 0);
}

module.exports = {
  getUserTypes,
  getUsers,
  getUserByUserId,
  createUser,
  updateUser,
  replaceUserFactories,
  replaceUserSeasons,
  getAssignedFactories,
  getAssignedSeasons,
  getUsersByFactory,
  getUserName,
  getUserFactoriesWithName,
  deleteUser,
  getUserFactData,
  updateLabNotificationFlags
};
