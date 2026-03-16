const { executeQuery } = require('../core/db/query-executor');

async function findTransferById(rid, seasonValue) {
  const rows = await executeQuery(
    `SELECT TOP 1
            t.id,
            t.T_Factory,
            t.R_Factory,
            CONVERT(varchar, t.R_TDate, 103) AS R_TDate,
            ISNULL(t.TransferInterUnit, 0) AS TransferInterUnit,
            ISNULL(t.ReceivedfromInterUnit, 0) AS ReceivedfromInterUnit,
            ISNULL(t.LessDriage, 0) AS LessDriage
     FROM TransferandRecievedUnit t
     WHERE t.id = @rid`,
    { rid },
    seasonValue
  );
  return rows[0] || null;
}

async function listTransfers(factoryCode, seasonValue) {
  try {
    return await executeQuery(
      `SELECT t.id,
              t.T_Factory,
              COALESCE(tf.F_Name, tff.F_Name, CAST(t.T_Factory AS varchar(20))) AS T_FactoryName,
              t.R_Factory,
              COALESCE(rf.F_Name, rff.F_Name, CAST(t.R_Factory AS varchar(20))) AS R_FactoryName,
              CONVERT(varchar, t.R_TDate, 103) AS R_TDate,
              ISNULL(t.TransferInterUnit, 0) AS TransferInterUnit,
              ISNULL(t.ReceivedfromInterUnit, 0) AS ReceivedfromInterUnit,
              ISNULL(t.LessDriage, 0) AS LessDriage
       FROM TransferandRecievedUnit t
       LEFT JOIN MI_Factory tf ON tf.F_Code = t.T_Factory
       LEFT JOIN Factory tff ON tff.f_code = t.T_Factory
       LEFT JOIN MI_Factory rf ON rf.F_Code = t.R_Factory
       LEFT JOIN Factory rff ON rff.f_code = t.R_Factory
       WHERE (@factoryCode IS NULL OR t.T_Factory = @factoryCode OR t.R_Factory = @factoryCode)
       ORDER BY t.R_TDate DESC, t.id DESC`,
      { factoryCode },
      seasonValue
    );
  } catch (error) {
    const message = String(error?.message || '');
    const canFallback = /invalid object name\s+'?mi_factory'?/i.test(message)
      || /invalid column name\s+'?f_name'?/i.test(message);
    if (!canFallback) throw error;

    return executeQuery(
      `SELECT t.id,
              t.T_Factory,
              COALESCE(tf.f_Name, CAST(t.T_Factory AS varchar(20))) AS T_FactoryName,
              t.R_Factory,
              COALESCE(rf.f_Name, CAST(t.R_Factory AS varchar(20))) AS R_FactoryName,
              CONVERT(varchar, t.R_TDate, 103) AS R_TDate,
              ISNULL(t.TransferInterUnit, 0) AS TransferInterUnit,
              ISNULL(t.ReceivedfromInterUnit, 0) AS ReceivedfromInterUnit,
              ISNULL(t.LessDriage, 0) AS LessDriage
       FROM TransferandRecievedUnit t
       LEFT JOIN Factory tf ON tf.f_code = t.T_Factory
       LEFT JOIN Factory rf ON rf.f_code = t.R_Factory
       WHERE (@factoryCode IS NULL OR t.T_Factory = @factoryCode OR t.R_Factory = @factoryCode)
       ORDER BY t.R_TDate DESC, t.id DESC`,
      { factoryCode },
      seasonValue
    );
  }
}

const userColumnCache = new Map();

async function resolveUserColumn(seasonValue) {
  if (userColumnCache.has(seasonValue)) return userColumnCache.get(seasonValue);
  const rows = await executeQuery(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_NAME = 'TransferandRecievedUnit'
       AND COLUMN_NAME IN ('Userid', 'UserID', 'USERID', 'User_Id', 'UserID', 'UserName', 'User')`,
    {},
    seasonValue
  ).catch(() => []);

  const col = rows?.[0]?.COLUMN_NAME ? String(rows[0].COLUMN_NAME) : null;
  userColumnCache.set(seasonValue, col);
  return col;
}

async function updateTransfer(payload, seasonValue) {
  const userColumn = await resolveUserColumn(seasonValue);
  const userSet = userColumn ? `, ${userColumn}=@userId` : '';

  await executeQuery(
    `UPDATE TransferandRecievedUnit
     SET T_Factory=@T_Factory,
         R_Factory=@R_Factory,
         R_TDate=@R_TDate,
         TransferInterUnit=@TransferInterUnit,
         ReceivedfromInterUnit=@ReceivedfromInterUnit,
         LessDriage=@LessDriage${userSet}
     WHERE id=@id`,
    payload,
    seasonValue
  );
}

async function deleteTransfer(id, seasonValue) {
  await executeQuery('DELETE FROM TransferandRecievedUnit WHERE id=@id', { id }, seasonValue);
}

async function createTransfer(payload, seasonValue) {
  const userColumn = await resolveUserColumn(seasonValue);
  const userCols = userColumn ? `, ${userColumn}` : '';
  const userVals = userColumn ? `, @userId` : '';

  await executeQuery(
    `INSERT INTO TransferandRecievedUnit
       (T_Factory, R_Factory, R_TDate, TransferInterUnit, ReceivedfromInterUnit, LessDriage${userCols})
     VALUES
       (@T_Factory, @R_Factory, @R_TDate, @TransferInterUnit, @ReceivedfromInterUnit, @LessDriage${userVals})`,
    payload,
    seasonValue
  );
}

module.exports = {
  findTransferById,
  listTransfers,
  updateTransfer,
  deleteTransfer,
  createTransfer
};
