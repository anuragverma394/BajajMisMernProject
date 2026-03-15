const { query, withSeason } = require('../core/db/query-executor');

async function findTransferById(rid, seasonValue) {
  const season = withSeason(seasonValue);
  const rows = await query(
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
    season
  );
  return rows[0] || null;
}

async function listTransfers(factoryCode, seasonValue) {
  const season = withSeason(seasonValue);
  return query(
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
    season
  );
}

async function updateTransfer(payload, seasonValue) {
  const season = withSeason(seasonValue);
  await query(
    `UPDATE TransferandRecievedUnit
     SET T_Factory=@T_Factory,
         R_Factory=@R_Factory,
         R_TDate=@R_TDate,
         TransferInterUnit=@TransferInterUnit,
         ReceivedfromInterUnit=@ReceivedfromInterUnit,
         LessDriage=@LessDriage,
         Userid=@userId
     WHERE id=@id`,
    payload,
    season
  );
}

async function deleteTransfer(id, seasonValue) {
  const season = withSeason(seasonValue);
  await query('DELETE FROM TransferandRecievedUnit WHERE id=@id', { id }, season);
}

async function createTransfer(payload, seasonValue) {
  const season = withSeason(seasonValue);
  await query(
    `INSERT INTO TransferandRecievedUnit
       (T_Factory, R_Factory, R_TDate, TransferInterUnit, ReceivedfromInterUnit, LessDriage, Userid)
     VALUES
       (@T_Factory, @R_Factory, @R_TDate, @TransferInterUnit, @ReceivedfromInterUnit, @LessDriage, @userId)`,
    payload,
    season
  );
}

module.exports = {
  findTransferById,
  listTransfers,
  updateTransfer,
  deleteTransfer,
  createTransfer
};
