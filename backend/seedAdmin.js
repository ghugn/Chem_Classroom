const path = require('path');
// Đảm bảo load biến môi trường chính xác (Tuyệt đối từ thư mục chứa file .env)
require('dotenv').config({ path: path.join(__dirname, '.env') });
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

console.log('\n=======================================');
console.log('🚀 SCRIPT SEED ADMIN');
console.log('=======================================');

if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: Không tìm thấy DATABASE_URL. Hãy kiểm tra file .env');
    process.exit(1);
} else {
    const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':*****@');
    console.log('✅ DATABASE_URL loaded:', maskedUrl);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const seedAdmin = async () => {
    try {
        console.log('⏳ Đang kiểm tra kết nối Database...');
        await pool.query('SELECT NOW()');
        console.log('✅ Kết nối Database thành công!');

        const email = 'admin@chemclass.com';
        const password = 'admin_password123';

        // Check user existence
        const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkUser.rows.length > 0) {
            console.log('✅ Tài khoản Admin đã tồn tại! Bỏ qua bước tạo mới.');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        await pool.query(
            `INSERT INTO users (email, password_hash, full_name, role) 
             VALUES ($1, $2, $3, $4)`,
            [email, hash, 'System Admin', 'ADMIN']
        );

        console.log('\n🎉 Đã tạo thành công tài khoản ADMIN mặc định!');
        console.log(`👤 Email: ${email}`);
        console.log(`🔑 Password: ${password}\n`);
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error seeding admin user!');
        console.error('Error Message:', error.message);
        console.error('Error Code:', error.code);

        if (error.code === '28P01') {
            console.error('-> Lỗi sai Password: Có thể PostgreSQL sử dụng auth method md5 vs scram-sha-256 không hợp lệ hoặc dotenv nhận giá trị rỗng.');
        } else if (error.code === '3D000') {
            console.error(`-> Lỗi mất Database: Database "chem_class" chưa tồn tại.`);
            console.error(`-> Chạy lệnh sau trong psql để tạo:\n   CREATE DATABASE chem_class;`);
        } else if (error.code === '42P01') {
            console.error(`-> Lỗi mất Bảng: Bảng "users" chưa tồn tại. Phải import file schema.sql vào cơ sở dữ liệu chem_class trước rồi mới seed!`);
        }
        process.exit(1);
    }
};

seedAdmin();
