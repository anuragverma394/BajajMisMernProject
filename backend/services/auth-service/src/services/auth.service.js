const bcrypt = require('bcryptjs');
const repository = require('../repositories/auth.repository');
const { signAuthToken } = require('../middleware/auth.middleware');
const { parseDDMMYYYY } = require('../utils/date');

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

function createServiceError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function convertLoginId(seasonValue) {
  const input = String(seasonValue || '2526');
  if (input.length !== 4) return input;
  const part1 = Number(input.slice(0, 2)) - 1;
  const part2 = Number(input.slice(2, 4)) - 1;
  return `${part1.toString().padStart(2, '0')}${part2.toString().padStart(2, '0')}`;
}

function resolveSeason(value) {
  return String(value || process.env.DEFAULT_SEASON || '2526');
}

function createTokenPayload(user, season) {
  return {
    id: user.id,
    userId: user.userid,
    utid: user.UTID,
    name: user.Name,
    factId: user.FactID,
    season
  };
}

function isHash(value) {
  return typeof value === 'string' && value.startsWith('$2');
}

async function verifyAndMigratePassword({ user, password, season }) {
  const stored = String(user.Password || '');
  if (!stored) return false;

  if (isHash(stored)) {
    return bcrypt.compare(password, stored);
  }

  if (password !== stored) return false;

  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await repository.updatePassword(user.userid, hashed, season);
  return true;
}

async function login({ userId, password, season }) {
  const users = await repository.findActiveUserByLogin(userId, season);
  if (!users.length) {
    throw createServiceError('Invalid credentials', 401);
  }

  const user = users[0];
  const valid = await verifyAndMigratePassword({ user, password, season });
  if (!valid) {
    throw createServiceError('Invalid credentials', 401);
  }

  const token = signAuthToken(createTokenPayload(user, season));

  return {
    token,
    user: {
      id: user.id,
      userId: user.userid,
      name: user.Name,
      utid: user.UTID,
      factId: user.FactID,
      season,
      connectionSeason: `BajajCane${convertLoginId(season)}`
    }
  };
}

async function changePassword({ userId, oldPassword, newPassword, season }) {
  const users = await repository.findActiveUserByLogin(userId, season);
  if (!users.length) {
    throw createServiceError('User not found', 404);
  }

  const user = users[0];
  const valid = await verifyAndMigratePassword({ user, password: oldPassword, season });
  if (!valid) {
    throw createServiceError('Invalid current password', 400);
  }

  const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  const updated = await repository.updatePassword(user.userid, hashed, season);
  if (!updated) {
    throw createServiceError('Password update failed', 500);
  }

  return { ok: true };
}

async function migratePasswords({ season, limit }) {
  const batchSize = Math.max(1, Math.min(Number(limit) || 100, 1000));
  let updated = 0;
  let scanned = 0;

  while (true) {
    const rows = await repository.getPlaintextPasswordUsers(batchSize, season);
    if (!rows.length) break;

    scanned += rows.length;
    for (const row of rows) {
      const plaintext = String(row.Password || '');
      if (!plaintext) continue;
      const hashed = await bcrypt.hash(plaintext, BCRYPT_ROUNDS);
      const count = await repository.updatePasswordById(row.ID, hashed, season);
      if (Number(count || 0) > 0) updated += 1;
    }
  }

  return { updated, scanned };
}

function mergePermissions(rows = []) {
  const map = new Map();
  for (const row of rows) {
    const key = String(row.ModualID || row.MID || '');
    if (!key) continue;

    const current = map.get(key) || {
      MID: row.MID,
      ModualID: row.ModualID,
      ModualName: row.ModualName,
      RADD: 0,
      RUPDATE: 0,
      RDELETE: 0,
      RVIEW: 0,
      REXPORT: 0,
      RPRINT: 0,
      RSEARCH: 0,
      RNotification: 0
    };

    current.MID = current.MID || row.MID;
    current.ModualID = current.ModualID || row.ModualID;
    current.ModualName = current.ModualName || row.ModualName;

    current.RADD = Math.max(Number(current.RADD || 0), Number(row.RADD || 0));
    current.RUPDATE = Math.max(Number(current.RUPDATE || 0), Number(row.RUPDATE || 0));
    current.RDELETE = Math.max(Number(current.RDELETE || 0), Number(row.RDELETE || 0));
    current.RVIEW = Math.max(Number(current.RVIEW || 0), Number(row.RVIEW || 0));
    current.REXPORT = Math.max(Number(current.REXPORT || 0), Number(row.REXPORT || 0));
    current.RPRINT = Math.max(Number(current.RPRINT || 0), Number(row.RPRINT || 0));
    current.RSEARCH = Math.max(Number(current.RSEARCH || 0), Number(row.RSEARCH || 0));
    current.RNotification = Math.max(Number(current.RNotification || 0), Number(row.RNotification || 0));

    map.set(key, current);
  }
  return Array.from(map.values());
}

async function pageLoad({ userId, utid, season }) {
  if (String(utid || '') === '1') return repository.getAllModules(season);
  const rows = await repository.getUserModulePermissions(userId, season);
  return mergePermissions(rows);
}

async function checkPageValidation({ userId, formId, season }) {
  const rows = await repository.getUserFormPermission(userId, formId, season);
  const merged = mergePermissions(rows);
  return merged.length ? merged[0] : [];
}

async function manageTableControl({ season }) {
  return repository.getTableControlRows(season);
}

async function updateDate({ code, date, season }) {
  const isoDate = parseDDMMYYYY(date);
  if (!isoDate) {
    throw createServiceError('date must be in dd/MM/yyyy format', 400);
  }
  const rowsAffected = await repository.updateTableControlDate(code, isoDate, season);
  return {
    ok: Number(rowsAffected || 0) > 0
  };
}

module.exports = {
  convertLoginId,
  resolveSeason,
  login,
  changePassword,
  pageLoad,
  checkPageValidation,
  manageTableControl,
  updateDate,
  migratePasswords
};
