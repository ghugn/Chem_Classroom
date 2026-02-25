const db = require('../config/db');

exports.getAdminDashboardStats = async (req, res) => {
    try {
        // 1. Tổng Học Sinh
        const studentsCountRes = await db.query(`SELECT COUNT(*) FROM users WHERE role = 'STUDENT'`);
        const totalStudents = parseInt(studentsCountRes.rows[0].count);

        // 2. Tổng Số Lớp
        const classesCountRes = await db.query(`SELECT COUNT(*) FROM classes`);
        const totalClasses = parseInt(classesCountRes.rows[0].count);

        // 3. Tổng Tài Liệu
        const materialsCountRes = await db.query(`SELECT COUNT(*) FROM materials`);
        const totalMaterials = parseInt(materialsCountRes.rows[0].count);

        // 4. Tổng Học Phí (Đã thu vs Chưa thu) dựa trên đợt thu (tuitions và tuition_batches)
        // PAID status
        const paidRes = await db.query(`
            SELECT SUM(tb.amount) 
            FROM tuitions t 
            JOIN tuition_batches tb ON t.batch_id = tb.id 
            WHERE t.status = 'paid'
        `);
        const totalPaid = parseInt(paidRes.rows[0].sum) || 0;

        // UNPAID status (Chưa thu)
        const unpaidRes = await db.query(`
            SELECT SUM(tb.amount) 
            FROM tuitions t 
            JOIN tuition_batches tb ON t.batch_id = tb.id 
            WHERE t.status = 'unpaid'
        `);
        const totalUnpaid = parseInt(unpaidRes.rows[0].sum) || 0;

        res.json({
            totalStudents,
            totalClasses,
            totalMaterials,
            financials: {
                totalPaid,
                totalUnpaid
            }
        });

    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ message: 'Lỗi lấy số liệu Dashboard' });
    }
};
