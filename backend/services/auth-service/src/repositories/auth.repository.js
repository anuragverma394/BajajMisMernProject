const { executeQuery, executeScalar } = require('../core/db/query-executor');

async function findActiveUserByLogin(userId, season) {
  return executeQuery(
    `SELECT TOP 1
      u.id,
      u.userid,
      u.UTID,
      u.Name,
      u.Password,
      ISNULL(f.FactID, 0) AS FactID
     FROM MI_User u
     LEFT JOIN MI_UserFact f ON u.Userid = f.UserID
     WHERE u.status = 1
       AND (u.userid = @userId OR u.Name = @userId)
     ORDER BY CASE WHEN u.userid = @userId THEN 0 ELSE 1 END, u.id`,
    { userId },
    season
  );
}

async function findActiveUserByLoginAndPassword(userId, password, season) {
  return executeQuery(
    `SELECT TOP 1
      u.id,
      u.userid,
      u.UTID,
      u.Name,
      u.Password,
      ISNULL(f.FactID, 0) AS FactID
     FROM MI_User u
     LEFT JOIN MI_UserFact f ON u.Userid = f.UserID
     WHERE u.status = 1
       AND (u.userid = @userId OR u.Name = @userId)
       AND u.Password = @password
     ORDER BY CASE WHEN u.userid = @userId THEN 0 ELSE 1 END, u.id`,
    { userId, password },
    season
  );
}

async function updatePassword(userId, newPassword, season) {
  return executeScalar(
    `UPDATE MI_User
     SET Password = @newPassword, CDate = GETDATE()
     WHERE Status = 1 AND userid = @userId;
     SELECT @@ROWCOUNT AS RowsAffected;`,
    { userId, newPassword },
    season
  );
}

async function getPlaintextPasswordUsers(limit, season) {
  return executeQuery(
    `SELECT TOP (@limit)
       ID,
       Userid,
       Password
     FROM MI_User
     WHERE Status = 1
       AND Password IS NOT NULL
       AND LEN(Password) > 0
       AND Password NOT LIKE '$2%'
     ORDER BY ID`,
    { limit },
    season
  );
}

async function updatePasswordById(id, newPassword, season) {
  return executeScalar(
    `UPDATE MI_User
     SET Password = @newPassword, CDate = GETDATE()
     WHERE ID = @id;
     SELECT @@ROWCOUNT AS RowsAffected;`,
    { id, newPassword },
    season
  );
}

async function getAllModules(season) {
  return executeQuery('SELECT * FROM MI_Modual ORDER BY MID', {}, season);
}

async function getUserModulePermissions(userId, season) {
  return executeQuery(
    `SELECT r.MID, m.ModualID, m.ModualName, r.RADD, r.RUPDATE, r.RDELETE, r.RVIEW, r.REXPORT, r.RPRINT, r.RSEARCH, r.RNotification
     FROM MI_Roll r
     JOIN MI_Modual m ON m.MId = r.MID
     WHERE r.R_Code IN (SELECT ur.R_Code FROM MI_UserRollAssign ur WHERE ur.userid = @userId)
     UNION ALL
     SELECT r.MID, m.ModualID, m.ModualName, r.RADD, r.RUPDATE, r.RDELETE, r.RVIEW, r.REXPORT, r.RPRINT, r.RSEARCH, r.RNotification
     FROM MI_UserRollAssignExtra r
     JOIN MI_Modual m ON m.MId = r.MID
     WHERE r.userid = @userId`,
    { userId },
    season
  );
}

async function getUserFormPermission(userId, formId, season) {
  return executeQuery(
    `SELECT r.MID, m.ModualID, m.ModualName, r.RADD, r.RUPDATE, r.RDELETE, r.RVIEW, r.REXPORT, r.RPRINT, r.RSEARCH, r.RNotification
     FROM MI_Roll r
     JOIN MI_Modual m ON m.MId = r.MID
     WHERE r.R_Code IN (SELECT ur.R_Code FROM MI_UserRollAssign ur WHERE ur.userid = @userId)
       AND m.ModualID = @formId
     UNION ALL
     SELECT r.MID, m.ModualID, m.ModualName, r.RADD, r.RUPDATE, r.RDELETE, r.RVIEW, r.REXPORT, r.RPRINT, r.RSEARCH, r.RNotification
     FROM MI_UserRollAssignExtra r
     JOIN MI_Modual m ON m.MId = r.MID
     WHERE r.userid = @userId AND m.ModualID = @formId`,
    { userId, formId },
    season
  );
}

async function getTableControlRows(season) {
  return executeQuery(
    `SELECT tc_id AS code, tc_name AS Name, FORMAT(TC_VALID_TILL, 'dd/MM/yyyy') AS Date
     FROM TableControl
     ORDER BY TC_VALID_TILL`,
    {},
    season
  );
}

async function updateTableControlDate(code, isoDate, season) {
  return executeScalar(
    `UPDATE TableControl
     SET TC_VALID_TILL = @date
     WHERE tc_id = @code;
     SELECT @@ROWCOUNT AS RowsAffected;`,
    { date: isoDate, code },
    season
  );
}

module.exports = {
  findActiveUserByLogin,
  findActiveUserByLoginAndPassword,
  updatePassword,
  getAllModules,
  getUserModulePermissions,
  getUserFormPermission,
  getTableControlRows,
  updateTableControlDate,
  getPlaintextPasswordUsers,
  updatePasswordById
};
