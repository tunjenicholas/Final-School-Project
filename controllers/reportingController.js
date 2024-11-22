const pool = require('../config/database');

exports.getOverallPerformance = async (req, res) => {
  try {
    const [performance] = await pool.query(`
      SELECT AVG(score) as average_score, MIN(score) as lowest_score,
             MAX(score) as highest_score
      FROM results
      WHERE academic_year = ? AND term = ?
    `, [req.query.academic_year, req.query.term]);
    res.json(performance[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching overall performance', error: error.message });
  }
};

exports.getGradeDistribution = async (req, res) => {
  try {
    const [distribution] = await pool.query(`
      SELECT grade, COUNT(*) as count
      FROM results
      WHERE academic_year = ? AND term = ?
      GROUP BY grade
      ORDER BY grade
    `, [req.query.academic_year, req.query.term]);
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching grade distribution', error: error.message });
  }
};

exports.getPerformanceTrends = async (req, res) => {
  try {
    const [trends] = await pool.query(`
      SELECT academic_year, term, AVG(score) as average_score
      FROM results
      GROUP BY academic_year, term
      ORDER BY academic_year, term
    `);
    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching performance trends', error: error.message });
  }
};

exports.getTopPerformers = async (req, res) => {
  try {
    const [topPerformers] = await pool.query(`
      SELECT u.full_name, c.class_name, AVG(r.score) as average_score
      FROM results r
      JOIN users u ON r.student_id = u.user_id
      JOIN classes c ON r.class_id = c.class_id
      WHERE r.academic_year = ? AND r.term = ?
      GROUP BY r.student_id, u.full_name, c.class_name
      ORDER BY average_score DESC
      LIMIT 10
    `, [req.query.academic_year, req.query.term]);
    res.json(topPerformers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching top performers', error: error.message });
  }
};

exports.generateStudentReportCard = async (req, res) => {
  try {
    const [studentInfo] = await pool.query(`
      SELECT u.full_name, s.student_number, c.class_name
      FROM users u
      JOIN students s ON u.user_id = s.user_id
      JOIN studentclasses sc ON u.user_id = sc.user_id
      JOIN classes c ON sc.class_id = c.class_id
      WHERE u.user_id = ? AND sc.academic_year = ?
    `, [req.params.studentId, req.query.academic_year]);

    if (studentInfo.length === 0) {
      return res.status(404).json({ message: 'Student not found or not enrolled for the specified academic year' });
    }

    const [results] = await pool.query(`
      SELECT s.subject_name, r.score, r.grade, r.grade_points, r.teacher_comment
      FROM results r
      JOIN subjects s ON r.subject_id = s.subject_id
      WHERE r.student_id = ? AND r.academic_year = ? AND r.term = ?
      ORDER BY s.subject_name
    `, [req.params.studentId, req.query.academic_year, req.query.term]);

    const [averageScore] = await pool.query(`
      SELECT AVG(score) as average_score, AVG(grade_points) as average_grade_points
      FROM results
      WHERE student_id = ? AND academic_year = ? AND term = ?
    `, [req.params.studentId, req.query.academic_year, req.query.term]);

    const reportCard = {
      studentInfo: studentInfo[0],
      results: results,
      averageScore: averageScore[0].average_score,
      averageGradePoints: averageScore[0].average_grade_points,
      academicYear: req.query.academic_year,
      term: req.query.term
    };

    res.json(reportCard);
  } catch (error) {
    res.status(500).json({ message: 'Error generating student report card', error: error.message });
  }
};

