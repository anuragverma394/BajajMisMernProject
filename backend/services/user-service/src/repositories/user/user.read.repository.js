const { query, scalar } = require('../../core/db/mssql');
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

async function getAssignedFactories(userId, season) {
  const result = await query(
    'SELECT FactID FROM MI_UserFact WHERE UserID=@userId',
    { userId },
    season
  );
  return result.rows;
}

async function getAssignedSeasons(_userId, _season) {
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

module.exports = {
  getUserTypes,
  getUsers,
  getAssignedFactories,
  getAssignedSeasons,
  getUsersByFactory,
  getUserName,
  getUserFactoriesWithName,
  getUserFactData
};
