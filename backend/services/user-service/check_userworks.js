
const { getPool } = require('./src/config/sqlserver');
require('dotenv').config();

async function check() {
  try {
    const pool = await getPool('2526');
    console.log('--- userworks Columns ---');
    const res = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'userworks'");
    console.log(JSON.stringify(res.recordset, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
