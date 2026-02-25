const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

console.log('\n=======================================');
console.log('🚀 SCRIPT SEED DỮ LIỆU MẪU (CHEM CLASS)');
console.log('=======================================');

if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: Không tìm thấy DATABASE_URL.');
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const seedData = async () => {
    try {
        console.log('⏳ Đang kết nối Database...');
        await pool.query('SELECT NOW()');
        console.log('✅ Kết nối thành công!');

        // 0. XÓA DỮ LIỆU CŨ (Để tránh lỗi Duplicate Key khi chạy nhiều lần)
        console.log('🧹 Đang dọn dẹp dữ liệu học sinh, lớp, nhóm, tài liệu cũ...');
        await pool.query('DELETE FROM materials');
        await pool.query('DELETE FROM tuition_payments');
        await pool.query('DELETE FROM student_groups');
        await pool.query('DELETE FROM groups');
        await pool.query('DELETE FROM classes');
        await pool.query('DELETE FROM subjects');
        await pool.query(`DELETE FROM users WHERE role = 'STUDENT'`);
        console.log('✅ Đã dọn dẹp xong dữ liệu cũ!');

        // 1. TẠO ADMIN (Hoặc lấy admin đã có)
        const adminEmail = 'admin@chemclass.com';
        const adminPass = 'admin_password123';
        let adminId;

        const checkAdmin = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
        if (checkAdmin.rows.length > 0) {
            adminId = checkAdmin.rows[0].id;
            console.log('✅ Tái sử dụng Admin đã có.');
        } else {
            const hash = await bcrypt.hash(adminPass, 10);
            const res = await pool.query(
                `INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id`,
                [adminEmail, hash, 'System Admin', 'ADMIN']
            );
            adminId = res.rows[0].id;
            console.log('✅ Đã tạo tài khoản Admin.');
        }

        // 2. TẠO MÔN HỌC (Subject)
        const subjectRes = await pool.query(
            `INSERT INTO subjects (name, description) VALUES ($1, $2) RETURNING id`,
            ['Hóa Học Hóa Phổ Thông', 'Chương trình Hóa học THPT']
        );
        const subjectId = subjectRes.rows[0].id;
        console.log('✅ Đã tạo Môn Học (Hóa Học).');

        // 3. TẠO LỚP HỌC (Classes)
        const classesData = [
            { name: 'Hóa 10', fee: 800000 },
            { name: 'Hóa 11', fee: 900000 },
            { name: 'Hóa 12 – Ôn THPTQG', fee: 1200000 }
        ];

        const createdClasses = [];
        for (const cls of classesData) {
            const res = await pool.query(
                `INSERT INTO classes (name, fee, subject_id, start_date) VALUES ($1, $2, $3, CURRENT_DATE) RETURNING id, name`,
                [cls.name, cls.fee, subjectId]
            );
            createdClasses.push({ id: res.rows[0].id, name: res.rows[0].name, fee: cls.fee });
        }
        console.log('✅ Đã tạo 3 Lớp học.');

        // 4. TẠO NHÓM (Groups) & TẠO HỌC SINH VÀ ĐƯA VÀO NHÓM
        const studentPasswordHash = await bcrypt.hash('123456', 10);
        let studentCount = 1;

        for (const cls of createdClasses) {
            // Mỗi lớp 2 nhóm
            const groups = ['Nhóm Cơ bản', 'Nhóm Nâng cao'];
            for (const groupName of groups) {
                const groupRes = await pool.query(
                    `INSERT INTO groups (class_id, name) VALUES ($1, $2) RETURNING id`,
                    [cls.id, groupName]
                );
                const groupId = groupRes.rows[0].id;

                // Mỗi nhóm 3 học sinh
                for (let i = 0; i < 3; i++) {
                    const studentName = `Học Sinh ${studentCount}`;
                    const studentEmail = `student${studentCount}@chemclass.com`;

                    const userRes = await pool.query(
                        `INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, 'STUDENT') RETURNING id`,
                        [studentEmail, studentPasswordHash, studentName]
                    );
                    const studentId = userRes.rows[0].id;

                    // Thêm vào nhóm (student_groups)
                    await pool.query(
                        `INSERT INTO student_groups (student_id, group_id) VALUES ($1, $2)`,
                        [studentId, groupId]
                    );

                    // Học phí (tuition_payments) -> Mặc định 1 người Paid, 2 người Unpaid cho đa dạng số liệu
                    const status = i === 0 ? 'PAID' : 'PENDING';
                    await pool.query(
                        `INSERT INTO tuition_payments (student_id, class_id, amount, status) VALUES ($1, $2, $3, $4)`,
                        [studentId, cls.id, cls.fee, status]
                    );

                    studentCount++;
                }
            }

            // 5. TẠO TÀI LIỆU (Materials) CHO LỚP
            const doc1 = `Chuyên đề Oxi hóa - khử (${cls.name}).pdf`;
            const doc2 = `Bài tập nâng cao (${cls.name}).pdf`;
            const docs = [doc1, doc2];

            for (const doc of docs) {
                await pool.query(
                    `INSERT INTO materials (class_id, subject_id, title, file_url, file_type, uploaded_by) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [cls.id, subjectId, doc, '/uploads/sample.pdf', 'pdf', adminId]
                );
            }
        }

        console.log('✅ Đã tạo 6 Nhóm, 18 Học sinh, và 6 Tài liệu.');
        console.log('\n🎉 SEED DỮ LIỆU HOÀN TẤT!');
        console.log('Lưu ý: Bạn có thể login bằng tài khoản admin@chemclass.com / admin_password123');
        console.log('Học sinh có thể login bằng student1@chemclass.com -> student18@chemclass.com / Mật khẩu: 123456\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error seeding data!');
        console.error(error);
        process.exit(1);
    }
};

seedData();
