-- Migration: Create class_enrollments table and migrate data

-- 1. Create the junction table
CREATE TABLE IF NOT EXISTS class_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_ce_student_id ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_ce_class_id ON class_enrollments(class_id);

-- 2. Migrate existing student-class relationships from tuition_payments
INSERT INTO class_enrollments (student_id, class_id)
SELECT DISTINCT tp.student_id, tp.class_id
FROM tuition_payments tp
WHERE tp.class_id IS NOT NULL
  AND tp.student_id IS NOT NULL
ON CONFLICT (student_id, class_id) DO NOTHING;

-- 3. Also migrate any student-class relationships from student_groups
INSERT INTO class_enrollments (student_id, class_id)
SELECT DISTINCT sg.student_id, g.class_id
FROM student_groups sg
JOIN groups g ON sg.group_id = g.id
WHERE g.class_id IS NOT NULL
ON CONFLICT (student_id, class_id) DO NOTHING;
