require('dotenv').config();
const { login } = require('./src/services/auth.service');

async function testLogin() {
  try {
    console.log('Testing login with sample user...');

    const result = await login({ userId: 'Admin', password: 'Bajaj@#11902', season: '2526' });
    console.log('Login Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Login Error:', err.message, err.statusCode);
  } finally {
    process.exit();
  }
}

testLogin();
