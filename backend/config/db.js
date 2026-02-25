const { Pool } = require('pg');
const path = require('path');
// Load .env explicitly with absolute path to avoid running-directory issues
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('\n--- 🛠 DATABASE CONFIG CHECK ---');
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is not defined in .env file!');
} else {
  // Mask password for security log
  const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':*****@');
  console.log('✅ DATABASE_URL loaded:', maskedUrl);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// A test function to verify connection at runtime
const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connection successful at:', res.rows[0].now);
  } catch (err) {
    console.error('\n❌ PostgreSQL Connection failed!');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);

    if (err.code === '28P01') {
      console.error('💡 GỢI Ý: Lệnh sai Mật khẩu/User. Nếu mật khẩu đúng, có thể do dotenv nạp bị sai biến.');
    } else if (err.code === '3D000') {
      console.error('💡 GỢI Ý: Database chưa được tạo! Hãy tạo database trước (CREATE DATABASE chem_class;).');
    }
  }
};

testConnection();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool // Export pool directly if needed
};
