const { executeQuery } = require('../../core/db/query-executor');

const TABLE_NAME = 'TransferandRecievedUnit';

const BASE_FIELDS = `
  t.id,
  t.T_Factory,
  t.R_Factory,
  CONVERT(varchar, t.R_TDate, 103) AS R_TDate,
  ISNULL(t.TransferInterUnit, 0) AS TransferInterUnit,
  ISNULL(t.ReceivedfromInterUnit, 0) AS ReceivedfromInterUnit,
  ISNULL(t.LessDriage, 0) AS LessDriage
`;

const FACTORY_FILTER = '(@factoryCode IS NULL OR t.T_Factory = @factoryCode OR t.R_Factory = @factoryCode)';
const ORDER_BY = 'ORDER BY t.R_TDate DESC, t.id DESC';

const FACTORY_NAME_SELECT = {
  withMi: `
    COALESCE(tf.F_Name, tff.F_Name, CAST(t.T_Factory AS varchar(20))) AS T_FactoryName,
    COALESCE(rf.F_Name, rff.F_Name, CAST(t.R_Factory AS varchar(20))) AS R_FactoryName`,
  factoryOnly: `
    COALESCE(tf.f_Name, CAST(t.T_Factory AS varchar(20))) AS T_FactoryName,
    COALESCE(rf.f_Name, CAST(t.R_Factory AS varchar(20))) AS R_FactoryName`
};

const FACTORY_JOINS = {
  withMi: `
    LEFT JOIN MI_Factory tf ON tf.F_Code = t.T_Factory
    LEFT JOIN Factory tff ON tff.f_code = t.T_Factory
    LEFT JOIN MI_Factory rf ON rf.F_Code = t.R_Factory
    LEFT JOIN Factory rff ON rff.f_code = t.R_Factory`,
  factoryOnly: `
    LEFT JOIN Factory tf ON tf.f_code = t.T_Factory
    LEFT JOIN Factory rf ON rf.f_code = t.R_Factory`
};

const USER_COLUMNS = ['Userid', 'UserID', 'USERID', 'User_Id', 'UserName', 'User'];
const userColumnCache = new Map();

const execute = (sql, params, seasonValue, options) =>
  executeQuery(sql, params, seasonValue, options);

const isMiFactoryMissingError = (error) => {
  const message = String(error?.message || '');
  return /invalid object name\s+'?mi_factory'?/i.test(message)
    || /invalid column name\s+'?f_name'?/i.test(message);
};

const buildTransferListSql = (useMiFactory) => `
  SELECT ${BASE_FIELDS},
         ${useMiFactory ? FACTORY_NAME_SELECT.withMi : FACTORY_NAME_SELECT.factoryOnly}
  FROM ${TABLE_NAME} t
  ${useMiFactory ? FACTORY_JOINS.withMi : FACTORY_JOINS.factoryOnly}
  WHERE ${FACTORY_FILTER}
  ${ORDER_BY}`;

async function findTransferById(rid, seasonValue) {
  const rows = await execute(
    `SELECT TOP 1 ${BASE_FIELDS}
     FROM ${TABLE_NAME} t
     WHERE t.id = @rid`,
    { rid },
    seasonValue
  );
  return rows[0] || null;
}

async function listTransfers(factoryCode, seasonValue) {
  try {
    return await execute(
      buildTransferListSql(true),
      { factoryCode },
      seasonValue
    );
  } catch (error) {
    if (!isMiFactoryMissingError(error)) throw error;
    return execute(
      buildTransferListSql(false),
      { factoryCode },
      seasonValue
    );
  }
}

async function resolveUserColumn(seasonValue) {
  if (userColumnCache.has(seasonValue)) return userColumnCache.get(seasonValue);
  const rows = await execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_NAME = @tableName
       AND COLUMN_NAME IN (${USER_COLUMNS.map((c) => `'${c}'`).join(', ')})`,
    { tableName: TABLE_NAME },
    {},
    seasonValue
  ).catch(() => []);

  const col = rows?.[0]?.COLUMN_NAME ? String(rows[0].COLUMN_NAME) : null;
  userColumnCache.set(seasonValue, col);
  return col;
}

const buildUserColumnParts = async (seasonValue) => {
  const userColumn = await resolveUserColumn(seasonValue);
  return {
    column: userColumn,
    setClause: userColumn ? `, ${userColumn}=@userId` : '',
    insertColumn: userColumn ? `, ${userColumn}` : '',
    insertValue: userColumn ? `, @userId` : ''
  };
};

async function updateTransfer(payload, seasonValue) {
  const { setClause } = await buildUserColumnParts(seasonValue);

  await execute(
    `UPDATE ${TABLE_NAME}
     SET T_Factory=@T_Factory,
         R_Factory=@R_Factory,
         R_TDate=@R_TDate,
         TransferInterUnit=@TransferInterUnit,
         ReceivedfromInterUnit=@ReceivedfromInterUnit,
         LessDriage=@LessDriage${setClause}
     WHERE id=@id`,
    payload,
    seasonValue
  );
}

async function deleteTransfer(id, seasonValue) {
  await execute(`DELETE FROM ${TABLE_NAME} WHERE id=@id`, { id }, seasonValue);
}

async function createTransfer(payload, seasonValue) {
  const { insertColumn, insertValue } = await buildUserColumnParts(seasonValue);

  await execute(
    `INSERT INTO ${TABLE_NAME}
       (T_Factory, R_Factory, R_TDate, TransferInterUnit, ReceivedfromInterUnit, LessDriage${insertColumn})
     VALUES
       (@T_Factory, @R_Factory, @R_TDate, @TransferInterUnit, @ReceivedfromInterUnit, @LessDriage${insertValue})`,
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
