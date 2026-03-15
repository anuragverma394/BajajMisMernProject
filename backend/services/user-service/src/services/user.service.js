const bcrypt = require('bcryptjs');
const { executeInTransaction, withSeason } = require('../core/db/mssql');
const userRepository = require('../repositories/user.repository');

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

async function getUserTypes(seasonValue) {
  const rows = await userRepository.getUserTypes(withSeason(seasonValue));
  return rows.map((r) => ({ id: r.UTID, name: r.UT_UserType }));
}

async function getUsers(filters, seasonValue) {
  const season = withSeason(seasonValue);
  const rows = await userRepository.getUsers(filters, season);
  if (!filters.id || !rows.length) return rows;

  const first = rows[0];
  const [units, seasons] = await Promise.all([
    userRepository.getAssignedFactories(first.Userid, season),
    userRepository.getAssignedSeasons(first.Userid, season)
  ]);

  return {
    ...first,
    assignedUnits: units.map((r) => String(r.FactID)),
    assignedSeasons: seasons.map((r) => String(r.u_season))
  };
}

async function upsertUser(payload, seasonValue) {
  const season = withSeason(seasonValue);
  
  // Validate required fields
  if (!payload.Userid || !payload.Name) {
    throw new Error('Userid and Name are required');
  }
  
  return executeInTransaction(season, async (transaction) => {
    const options = { transaction };
    const shouldCreate = !payload.ID;
    let passwordHash = '';

    if (shouldCreate) {
      // For new users, check if userid already exists
      const existing = await userRepository.getUserByUserId(payload.Userid, season, options);
      if (existing) {
        const error = new Error(`User ${payload.Userid} already exists`);
        error.statusCode = 409;
        throw error;
      }
      // New users must have a password (already validated by validation middleware)
      if (!payload.Password) {
        throw new Error('Password is required for new users');
      }
      passwordHash = await bcrypt.hash(payload.Password, BCRYPT_ROUNDS);
    } else {
      // For updates, get the current user to verify they exist
      const userByUserId = await userRepository.getUserByUserId(payload.Userid, season, options);
      
      if (!userByUserId || userByUserId.ID !== Number(payload.ID)) {
        const error = new Error(`User with ID ${payload.ID} not found`);
        error.statusCode = 404;
        throw error;
      }
      
      // If updating with new password, hash it; otherwise keep existing password
      if (payload.Password) {
        passwordHash = await bcrypt.hash(payload.Password, BCRYPT_ROUNDS);
      } else {
        passwordHash = userByUserId.Password;
      }
    }

    const model = {
      ID: payload.ID || null,
      Userid: String(payload.Userid).trim(),
      Name: String(payload.Name).trim(),
      Password: passwordHash,
      Status: String(payload.Status || '1').trim(),
      UTID: Number(payload.UTID) || 2,
      SAPCode: String(payload.SAPCode || '').trim(),
      Mobile: String(payload.Mobile || '').trim(),
      EmailID: String(payload.EmailID || '').trim(),
      DOB: String(payload.DOB || '').trim(),
      Gender: String(payload.Gender || '1').trim(),
      Type: String(payload.Type || 'Other').trim(),
      GPS_Notification: payload.GPS_Notification ? 1 : 0,
      TimeFrom: String(payload.TimeFrom || '0600').trim(),
      TimeTo: String(payload.TimeTo || '1800').trim()
    };

    if (shouldCreate) {
      await userRepository.createUser(model, season, options);
    } else {
      await userRepository.updateUser(model, season, options);
    }

    // Only assign factories and seasons if provided
    const units = Array.isArray(payload.units) ? payload.units : [];
    const seasons = Array.isArray(payload.seasons) ? payload.seasons : [];
    
    if (units.length > 0) {
      await userRepository.replaceUserFactories(payload.Userid, units, season, options);
    }
    if (seasons.length > 0) {
      await userRepository.replaceUserSeasons(payload.Userid, seasons, season, options);
    }
  });
}

async function userCodeChanged(userId, seasonValue) {
  const season = withSeason(seasonValue);
  if (!userId) return false;
  const existing = await userRepository.getUserByUserId(userId, season);
  return !!existing;
}

async function getUsersByFactory(factId, seasonValue) {
  return userRepository.getUsersByFactory(factId, withSeason(seasonValue));
}

async function getUserNameAndFactories(userId, seasonValue) {
  const season = withSeason(seasonValue);
  const [name, otherlist] = await Promise.all([
    userRepository.getUserName(userId, season),
    userRepository.getUserFactoriesWithName(userId, season)
  ]);
  if (!name) return null;
  return {
    username: name,
    otherlist
  };
}

async function deleteUser(id, userId, seasonValue) {
  await userRepository.deleteUser(id, userId, withSeason(seasonValue));
}

async function getUserFactData(factId, seasonValue) {
  return userRepository.getUserFactData(factId, withSeason(seasonValue));
}

async function updateLabNotificationFlags(items, seasonValue) {
  const season = withSeason(seasonValue);
  return executeInTransaction(season, async (transaction) => {
    const options = { transaction };
    return userRepository.updateLabNotificationFlags(items, season, options);
  });
}

module.exports = {
  getUserTypes,
  getUsers,
  upsertUser,
  userCodeChanged,
  getUsersByFactory,
  getUserNameAndFactories,
  deleteUser,
  getUserFactData,
  updateLabNotificationFlags
};
