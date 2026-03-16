function toIsoDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const ddmmyyyyMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyyMatch) return `${ddmmyyyyMatch[3]}-${ddmmyyyyMatch[2]}-${ddmmyyyyMatch[1]}`;
  const ddmmyyyyDash = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyyDash) return `${ddmmyyyyDash[3]}-${ddmmyyyyDash[2]}-${ddmmyyyyDash[1]}`;
  const ymdSlash = raw.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (ymdSlash) return `${ymdSlash[1]}-${ymdSlash[2]}-${ymdSlash[3]}`;
  const dt = new Date(raw);
  if (!Number.isNaN(dt.getTime())) {
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

function toNumber(value, defaultValue = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : defaultValue;
}

function normalizeTransferReadQuery(req) {
  const rid = String(req.query.Rid || req.query.id || '').trim();
  const factoryCodeRaw = String(req.query.factoryCode || req.query.t_Factory || '').trim();
  const factoryCode = factoryCodeRaw === '' ? null : Number(factoryCodeRaw);

  return {
    rid,
    factoryCodeRaw,
    factoryCode
  };
}

function normalizeTransferWriteBody(req) {
  const command = String(req.body.Command || req.body.command || req.body.id || 'btninsert').trim().toLowerCase();
  const id = String(req.body.id || req.body.Rid || '').trim();
  const T_Factory = Number(req.body.t_Factory || req.body.T_Factory || 0);
  const R_Factory = Number(req.body.r_Factory || req.body.R_Factory || T_Factory || 0);
  const R_TDate = toIsoDate(req.body.r_TDate || req.body.R_TDate);
  const TransferInterUnit = toNumber(req.body.transferInterUnit || req.body.TransferInterUnit, 0);
  const ReceivedfromInterUnit = toNumber(req.body.receivedfromInterUnit || req.body.ReceivedfromInterUnit, 0);
  const LessDriage = toNumber(req.body.lessDriage || req.body.LessDriage, 0);
  const userId = String(req.user?.userId || req.body.userId || '').trim();

  return {
    command,
    id,
    T_Factory,
    R_Factory,
    R_TDate,
    TransferInterUnit,
    ReceivedfromInterUnit,
    LessDriage,
    userId
  };
}

module.exports = {
  normalizeTransferReadQuery,
  normalizeTransferWriteBody
};
