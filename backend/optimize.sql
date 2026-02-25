-- 1. Thêm Index tối ưu hóa truy vấn
CREATE INDEX IF NOT EXISTS idx_users_class_id ON users(class_id);
CREATE INDEX IF NOT EXISTS idx_tuitions_batch_id ON tuitions(batch_id);
CREATE INDEX IF NOT EXISTS idx_tuitions_student_id ON tuitions(student_id);
CREATE INDEX IF NOT EXISTS idx_tuition_batches_class_id ON tuition_batches(class_id);
CREATE INDEX IF NOT EXISTS idx_documents_class_id ON materials(class_id);
CREATE INDEX IF NOT EXISTS idx_tuition_payments_class_id ON tuition_payments(class_id);

-- 2. Thêm UNIQUE Constraint tránh trùng lặp học phí cùng đợt
ALTER TABLE tuitions DROP CONSTRAINT IF EXISTS uq_tuition_batch_student;
ALTER TABLE tuitions ADD CONSTRAINT uq_tuition_batch_student UNIQUE (batch_id, student_id);
