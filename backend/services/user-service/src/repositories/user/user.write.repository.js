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

async function replaceUserSeasons(_userId, _seasons, _season, _options = {}) {
  // Season mapping skipped locally as the central mapping table does not exist.
  return Promise.resolve();
}

async function deleteUser(id, userId, season) {
  await query(
    'DELETE FROM MI_User WHERE ID=@id AND Userid=@userId',
    { id, userId },
    season
  );
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
  createUser,
  updateUser,
  replaceUserFactories,
  replaceUserSeasons,
  deleteUser,
  updateLabNotificationFlags
};
