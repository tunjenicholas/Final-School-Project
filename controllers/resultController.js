const pool = require('../config/database');
const { calculateGrade, calculateGradePoints } = require('../utils/grading');

exports.addResult = async (req, res) => {
  console.log('addResult function called');
  const { student_id, class_id, subject_id, score, term, academic_year, teacher_comment } = req.body;
  try {
    console.log('Checking if user exists...');
    const [users] = await pool.query('SELECT * FROM Users WHERE user_id = ?', [student_id]);
    if (users.length === 0) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User found');

    const grade = calculateGrade(score);
    const gradePoints = calculateGradePoints(grade);
    console.log('Calculated grade and grade points:', { grade, gradePoints });

    console.log('Inserting result into database...');
    const [result] = await pool.query(`
      INSERT INTO results (student_id, class_id, subject_id, score, grade, grade_points, term, academic_year, teacher_comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [student_id, class_id, subject_id, score, grade, gradePoints, term, academic_year, teacher_comment || null]);
    console.log('Result inserted successfully:', result);

    res.status(201).json({ message: 'Result added successfully', resultId: result.insertId });
  } catch (error) {
    console.error('Error adding result:', error);
    res.status(500).json({ message: 'Error adding result', error: error.message });
  }
};

exports.getResults = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const [results] = await pool.query(`
      SELECT r.*, u.full_name AS student_name, c.class_name, s.subject_name
      FROM results r
      JOIN Users u ON r.student_id = u.user_id
      JOIN classes c ON r.class_id = c.class_id
      JOIN subjects s ON r.subject_id = s.subject_id
      ORDER BY r.result_id DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [totalCount] = await pool.query('SELECT COUNT(*) as count FROM results');
    const totalPages = Math.ceil(totalCount[0].count / limit);

    res.json({
      results,
      currentPage: page,
      totalPages
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ message: 'Error fetching results', error: error.message });
  }
};

exports.getResultById = async (req, res) => {
  try {
    const [result] = await pool.query('SELECT * FROM results WHERE result_id = ?', [req.params.id]);
    if (result.length === 0) {
      return res.status(404).json({ message: 'Result not found' });
    }
    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ message: 'Error fetching result', error: error.message });
  }
};

exports.updateResult = async (req, res) => {
  const { score, term, academic_year, teacher_comment } = req.body;
  const { id } = req.params;
  try {
    const grade = calculateGrade(score);
    const gradePoints = calculateGradePoints(grade);
    const [result] = await pool.query(`
      UPDATE results 
      SET score = ?, grade = ?, grade_points = ?, term = ?, academic_year = ?, teacher_comment = ?
      WHERE result_id = ?
    `, [score, grade, gradePoints, term, academic_year, teacher_comment || null, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Result not found' });
    }
    res.json({ message: 'Result updated successfully' });
  } catch (error) {
    console.error('Error updating result:', error);
    res.status(500).json({ message: 'Error updating result', error: error.message });
  }
};

exports.deleteResult = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM results WHERE result_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Result not found' });
    }
    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({ message: 'Error deleting result', error: error.message });
  }
};

