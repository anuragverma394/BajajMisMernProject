const { query } = require('../../core/db/mssql');

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

module.exports = {
  getUserByUserId
};
