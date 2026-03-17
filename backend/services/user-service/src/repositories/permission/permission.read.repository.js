const { query } = require('../../core/db/mssql');

async function getUserRightsView(filters, season) {
  const command = String(filters.command || '').trim();
  if (command !== 'Search') return [];

  const params = {
    fcode: String(filters.fcode || '').trim(),
    userid: String(filters.userid || '').trim()
  };
  const fFilter = params.fcode && params.fcode !== '0' ? 'AND ura.factid=@fcode' : '';
  const uFilter = params.userid ? 'AND ura.userid=@userid' : '';
  const fFilterUserFact = params.fcode && params.fcode !== '0' ? 'AND uf.FactID=@fcode' : '';
  const uFilterUserFact = params.userid ? 'AND u.Userid=@userid' : '';

  const result = await query(
    `SELECT ura.factid, f.F_Name, ura.Userid, u.Name,
            ISNULL((SELECT DISTINCT R_Name FROM MI_Roll WHERE R_Code=ura.R_Code), 'NA') AS R_Name
     FROM MI_UserRollAssign ura
     JOIN MI_User u ON u.Userid=ura.userid
     JOIN MI_UserFact uf ON uf.Userid=ura.userid AND uf.FactID=ura.factid
     JOIN MI_Factory f ON f.F_Code=ura.factid
     WHERE 1=1 ${fFilter} ${uFilter}
     UNION
     SELECT ura.factid, f.F_Name, ura.Userid, u.Name, 'Extra' AS R_Name
     FROM MI_UserRollAssignExtra ura
     JOIN MI_User u ON u.Userid=ura.userid
     JOIN MI_UserFact uf ON uf.Userid=ura.userid AND uf.FactID=ura.factid
     JOIN MI_Factory f ON f.F_Code=ura.factid
     WHERE 1=1 ${fFilter} ${uFilter}
     UNION
     SELECT uf.FactID AS factid, f.F_Name, u.Userid, u.Name, 'NA' AS R_Name
     FROM MI_UserFact uf
     JOIN MI_User u ON u.Userid=uf.Userid
     JOIN MI_Factory f ON f.F_Code=uf.FactID
     WHERE 1=1 ${fFilterUserFact} ${uFilterUserFact}
       AND NOT EXISTS (
         SELECT 1 FROM MI_UserRollAssign ura
         WHERE ura.Userid=uf.Userid AND ura.factid=uf.FactID
       )
       AND NOT EXISTS (
         SELECT 1 FROM MI_UserRollAssignExtra urae
         WHERE urae.Userid=uf.Userid AND urae.factid=uf.FactID
       )`,
    params,
    season
  );
  return result.rows;
}

module.exports = {
  getUserRightsView
};
