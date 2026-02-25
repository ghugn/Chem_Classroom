-- Xóa trắng dữ liệu cũ để tránh trùng lặp nếu chạy lại script
TRUNCATE TABLE tuitions CASCADE;
TRUNCATE TABLE tuition_batches CASCADE;

-- Block anonymous PL/pgSQL để thực thi Insert tự động với biến
DO $$
DECLARE
    c10_id UUID;
    c11_id UUID;
    c12_id UUID;
    b10_id UUID;
    b11_id UUID;
    b12_id UUID;
BEGIN
    -- 1. Lấy tự động Class IDs
    SELECT id INTO c10_id FROM classes WHERE name = 'Hóa 10' LIMIT 1;
    SELECT id INTO c11_id FROM classes WHERE name = 'Hóa 11' LIMIT 1;
    SELECT id INTO c12_id FROM classes WHERE name = 'Hóa 12' LIMIT 1;

    -- 2. Khởi tạo 3 tuition_batches
    IF c10_id IS NOT NULL THEN
        INSERT INTO tuition_batches (title, class_id, amount) VALUES 
            ('Học phí tháng 3 - Hóa 10', c10_id, 800000) RETURNING id INTO b10_id;
    END IF;

    IF c11_id IS NOT NULL THEN
        INSERT INTO tuition_batches (title, class_id, amount) VALUES 
            ('Học phí tháng 3 - Hóa 11', c11_id, 900000) RETURNING id INTO b11_id;
    END IF;

    IF c12_id IS NOT NULL THEN
        INSERT INTO tuition_batches (title, class_id, amount) VALUES 
            ('Học phí tháng 3 - Hóa 12', c12_id, 1200000) RETURNING id INTO b12_id;
    END IF;

    --------------------------------------------------
    -- 3. Tạo tuitions cho Hóa 10 (cả 2 đều unpaid)
    --------------------------------------------------
    IF b10_id IS NOT NULL THEN
        INSERT INTO tuitions (batch_id, student_id, status, paid_at)
        SELECT b10_id, id, 'unpaid', NULL
        FROM users 
        WHERE role = 'STUDENT' AND full_name IN ('student5', 'student6');
    END IF;

    --------------------------------------------------
    -- 4. Tạo tuitions cho Hóa 11 (Có paid và unpaid)
    --------------------------------------------------
    IF b11_id IS NOT NULL THEN
        -- Đã nộp (paid)
        INSERT INTO tuitions (batch_id, student_id, status, paid_at)
        SELECT b11_id, id, 'paid', NOW()
        FROM users 
        WHERE role = 'STUDENT' AND full_name IN ('hung', 'student7', 'student10');

        -- Chưa nộp (unpaid)
        INSERT INTO tuitions (batch_id, student_id, status, paid_at)
        SELECT b11_id, id, 'unpaid', NULL
        FROM users 
        WHERE role = 'STUDENT' AND full_name IN ('student8', 'student9', 'student11', 'student12');
    END IF;

    --------------------------------------------------
    -- 5. Tạo tuitions cho Hóa 12 (Có paid và unpaid)
    --------------------------------------------------
    IF b12_id IS NOT NULL THEN
        -- Đã nộp (paid)
        INSERT INTO tuitions (batch_id, student_id, status, paid_at)
        SELECT b12_id, id, 'paid', NOW()
        FROM users 
        WHERE role = 'STUDENT' AND full_name IN ('student13', 'student16');

        -- Chưa nộp (unpaid)
        INSERT INTO tuitions (batch_id, student_id, status, paid_at)
        SELECT b12_id, id, 'unpaid', NULL
        FROM users 
        WHERE role = 'STUDENT' AND full_name IN ('student14', 'student15', 'student17', 'student18');
    END IF;

END $$;

--------------------------------------------------
-- BỔ SUNG YÊU CẦU: Truy vấn Tổng quát Thống Kê
--------------------------------------------------
SELECT 
    tb.title AS "Tên Đợt Thu",
    c.name AS "Lớp",
    COUNT(t.id) AS "Tổng số học sinh",
    (tb.amount * COUNT(t.id)) AS "Tổng tiền phải thu",
    COALESCE(SUM(CASE WHEN t.status = 'paid' THEN tb.amount ELSE 0 END), 0) AS "Tổng tiền đã thu",
    (tb.amount * COUNT(t.id)) - COALESCE(SUM(CASE WHEN t.status = 'paid' THEN tb.amount ELSE 0 END), 0) AS "Tổng tiền chưa thu"
FROM tuition_batches tb
JOIN classes c ON tb.class_id = c.id
LEFT JOIN tuitions t ON tb.id = t.batch_id
GROUP BY tb.id, tb.title, c.name, tb.amount
ORDER BY c.name ASC;
