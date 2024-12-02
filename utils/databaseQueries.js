const pool = require('../config/database');

exports.fetchResultsFromDatabase = async (studentId, term, academicYear) => {
  const [results] = await pool.query(`
    SELECT r.*, s.subject_name, c.class_name
    FROM results r
    JOIN subjects s ON r.subject_id = s.subject_id
    JOIN classes c ON r.class_id = c.class_id
    WHERE r.student_id = ? AND r.term = ? AND r.academic_year = ?
  `, [studentId, term, academicYear]);
  return results;
};

exports.calculateClassPerformance = async (classId, term, academicYear) => {
  const [performance] = await pool.query(`
    SELECT 
      AVG(r.score) as average_score,
      COUNT(DISTINCT r.student_id) as total_students,
      COUNT(CASE WHEN r.grade = 'A' THEN 1 END) as a_count,
      COUNT(CASE WHEN r.grade = 'B' THEN 1 END) as b_count,
      COUNT(CASE WHEN r.grade = 'C' THEN 1 END) as c_count,
      COUNT(CASE WHEN r.grade = 'D' THEN 1 END) as d_count,
      COUNT(CASE WHEN r.grade = 'E' THEN 1 END) as e_count
    FROM results r
    JOIN students s ON r.student_id = s.user_id
    WHERE s.current_class_id = ? AND r.term = ? AND r.academic_year = ?
  `, [classId, term, academicYear]);
  return performance[0];
};

exports.generateClassReport = async (classId, term, academicYear) => {
  const [students] = await pool.query(`
    SELECT u.user_id, u.full_name, AVG(r.score) as average_score
    FROM users u
    JOIN students s ON u.user_id = s.user_id
    LEFT JOIN results r ON u.user_id = r.student_id
    WHERE s.current_class_id = ? AND r.term = ? AND r.academic_year = ?
    GROUP BY u.user_id
    ORDER BY average_score DESC
  `, [classId, term, academicYear]);

  const [classInfo] = await pool.query(`
    SELECT c.class_name, s.stream_name, s.form_name
    FROM classes c
    JOIN streams s ON c.stream_id = s.stream_id
    WHERE c.class_id = ?
  `, [classId]);

  return {
    classInfo: classInfo[0],
    term,
    academicYear,
    students: students.map((student, index) => ({
      ...student,
      rank: index + 1,
      grade: calculateGrade(student.average_score)
    })),
    classAverage: students.reduce((sum, student) => sum + student.average_score, 0) / students.length
  };
};

exports.fetchChildrenIds = async (parentId) => {
  const [children] = await pool.query(`
    SELECT student_id
    FROM parentstudent
    WHERE parent_id = ?
  `, [parentId]);
  return children.map(child => child.student_id);
};

exports.fetchResultsForChildren = async (childrenIds) => {
  const [results] = await pool.query(`
    SELECT 
      u.full_name as student_name,
      c.class_name,
      s.subject_name,
      r.score,
      r.grade,
      r.term,
      r.academic_year
    FROM users u
    JOIN students st ON u.user_id = st.user_id
    JOIN classes c ON st.current_class_id = c.class_id
    JOIN results r ON u.user_id = r.student_id
    JOIN subjects s ON r.subject_id = s.subject_id
    WHERE u.user_id IN (?)
    ORDER BY u.full_name, r.academic_year, r.term, s.subject_name
  `, [childrenIds]);
  return results;
};

exports.fetchPerformanceForChildren = async (childrenIds) => {
  const [performance] = await pool.query(`
    SELECT 
      u.full_name as student_name,
      c.class_name,
      AVG(r.score) as average_score,
      MAX(r.score) as highest_score,
      MIN(r.score) as lowest_score,
      r.term,
      r.academic_year
    FROM users u
    JOIN students st ON u.user_id = st.user_id
    JOIN classes c ON st.current_class_id = c.class_id
    JOIN results r ON u.user_id = r.student_id
    WHERE u.user_id IN (?)
    GROUP BY u.user_id, r.term, r.academic_year
    ORDER BY u.full_name, r.academic_year, r.term
  `, [childrenIds]);
  return performance;
};

exports.assignRoleToUser = async (userId, roleId) => {
  await pool.query(`
    INSERT INTO UserRoles (user_id, role_id) VALUES (?, ?)
  `, [userId, roleId]);
};

exports.approveResults = async (resultIds) => {
  await pool.query(`
    UPDATE results
    SET is_approved = TRUE
    WHERE result_id IN (?)
  `, [resultIds]);
};

exports.lockResults = async (classId, term, academicYear) => {
  await pool.query(`
    UPDATE results
    SET is_locked = TRUE
    WHERE class_id = ? AND term = ? AND academic_year = ?
  `, [classId, term, academicYear]);
};

// Helper function to calculate grade
function calculateGrade(score) {
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'E';
}

module.exports = exports;