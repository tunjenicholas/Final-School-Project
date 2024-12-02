const pool = require('../config/database');
const { calculateGrade, calculateGradePoints } = require('../utils/grading');

exports.addResult = async (req, res) => {
  const { student_id, class_id, subject_id, score, term, academic_year, teacher_comment } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM Users WHERE user_id = ?', [student_id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const grade = calculateGrade(score);
    const gradePoints = calculateGradePoints(grade);

    const [result] = await pool.query(`
      INSERT INTO results (student_id, class_id, subject_id, score, grade, grade_points, term, academic_year, teacher_comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [student_id, class_id, subject_id, score, grade, gradePoints, term, academic_year, teacher_comment || null]);

    // Create notification for the student
    await createNotification(student_id, `New result added for ${subject_id} in ${term} ${academic_year}`);

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

exports.registerSubjects = async (req, res) => {
  const { studentId, subjects } = req.body;
  const connection = await pool.getConnection();
  
  try {
      await connection.beginTransaction();
      
      // Delete existing subject registrations for the student
      await connection.query('DELETE FROM StudentSubjects WHERE student_id = ?', [studentId]);
      
      // Insert new subject registrations
      for (const subjectId of subjects) {
          await connection.query('INSERT INTO StudentSubjects (student_id, subject_id) VALUES (?, ?)', [studentId, subjectId]);
      }
      
      await connection.commit();
      res.json({ message: 'Subjects registered successfully' });
  } catch (error) {
      await connection.rollback();
      console.error('Error registering subjects:', error);
      res.status(500).json({ message: 'Error registering subjects', error: error.message });
  } finally {
      connection.release();
  }
};

exports.getStudentSubjects = async (req, res) => {
  const { studentId } = req.params;
  try {
      const [subjects] = await pool.query(`
          SELECT s.subject_id, s.subject_name
          FROM Subjects s
          JOIN StudentSubjects ss ON s.subject_id = ss.subject_id
          WHERE ss.student_id = ?
      `, [studentId]);
      res.json(subjects);
  } catch (error) {
      console.error('Error fetching student subjects:', error);
      res.status(500).json({ message: 'Error fetching student subjects', error: error.message });
  }
};

exports.generateResultSlip = async (req, res) => {
  const { studentId, term, academicYear } = req.params;
  try {
      // Fetch student details
      const [studentDetails] = await pool.query(`
          SELECT u.full_name, s.student_number, c.class_name
          FROM Users u
          JOIN Students s ON u.user_id = s.user_id
          JOIN Classes c ON s.current_class_id = c.class_id
          WHERE u.user_id = ?
      `, [studentId]);

      if (studentDetails.length === 0) {
          return res.status(404).json({ message: 'Student not found' });
      }

      // Fetch results
      const [results] = await pool.query(`
          SELECT s.subject_name, r.score, r.grade, r.grade_points
          FROM Results r
          JOIN Subjects s ON r.subject_id = s.subject_id
          WHERE r.student_id = ? AND r.term = ? AND r.academic_year = ?
      `, [studentId, term, academicYear]);

      // Calculate total marks and average
      const totalMarks = results.reduce((sum, result) => sum + result.score, 0);
      const averageScore = results.length > 0 ? totalMarks / results.length : 0;
      const averageGrade = calculateGrade(averageScore);
      const averageGradePoints = calculateGradePoints(averageGrade);

      // Fetch class position
      const [classPosition] = await pool.query(`
          SELECT position
          FROM (
              SELECT student_id, 
                     RANK() OVER (ORDER BY AVG(score) DESC) as position
              FROM Results
              WHERE class_id = (SELECT current_class_id FROM Students WHERE user_id = ?)
                AND term = ? AND academic_year = ?
              GROUP BY student_id
          ) as rankings
          WHERE student_id = ?
      `, [studentId, term, academicYear, studentId]);

      const resultSlip = {
          studentInfo: studentDetails[0],
          results: results,
          summary: {
              totalMarks,
              averageScore,
              averageGrade,
              averageGradePoints,
              classPosition: classPosition[0] ? classPosition[0].position : 'N/A'
          },
          term,
          academicYear
      };

      res.json(resultSlip);
  } catch (error) {
      console.error('Error generating result slip:', error);
      res.status(500).json({ message: 'Error generating result slip', error: error.message });
  }
};

exports.getPerformanceAnalytics = async (req, res) => {
  const { studentId } = req.params;
  try {
      // Fetch performance over time
      const [performanceOverTime] = await pool.query(`
          SELECT term, academic_year, AVG(score) as average_score
          FROM Results
          WHERE student_id = ?
          GROUP BY term, academic_year
          ORDER BY academic_year, term
      `, [studentId]);

      // Fetch subject-wise performance
      const [subjectPerformance] = await pool.query(`
          SELECT s.subject_name, AVG(r.score) as average_score
          FROM Results r
          JOIN Subjects s ON r.subject_id = s.subject_id
          WHERE r.student_id = ?
          GROUP BY r.subject_id
          ORDER BY average_score DESC
      `, [studentId]);

      res.json({
          performanceOverTime,
          subjectPerformance
      });
  } catch (error) {
      console.error('Error fetching performance analytics:', error);
      res.status(500).json({ message: 'Error fetching performance analytics', error: error.message });
  }
};