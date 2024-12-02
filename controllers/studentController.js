const pool = require('../config/database');

exports.getStudentProfile = async (req, res) => {
  try {
      const [user] = await pool.query(
          'SELECT user_id, full_name, username, email, student_id FROM Users WHERE user_id = ?',
          [req.user.id]
      );

      if (user.length === 0) {
          return res.status(404).json({ message: 'Student not found' });
      }

      res.json(user[0]);
  } catch (error) {
      console.error('Error fetching student profile:', error);
      res.status(500).json({ message: 'Error fetching student profile', error: error.message });
  }
};



exports.getStudentClass = async (req, res) => {
  const { studentId } = req.params;
  try {
      const [classInfo] = await pool.query(`
          SELECT c.*, s.stream_name, s.form_name
          FROM Students st
          JOIN classes c ON st.current_class_id = c.class_id
          LEFT JOIN streams s ON c.stream_id = s.stream_id
          WHERE st.user_id = ?
      `, [studentId]);

      if (classInfo.length === 0) {
          return res.status(404).json({ message: 'Class information not found' });
      }

      res.json(classInfo[0]);
  } catch (error) {
      console.error('Error fetching student class:', error);
      res.status(500).json({ message: 'Error fetching student class', error: error.message });
  }
};

exports.getDashboardData = async (req, res) => {
  const { studentId } = req.params;
  try {
      // Fetch current GPA and latest results
      const [results] = await pool.query(`
          SELECT r.*, s.subject_name
          FROM results r
          JOIN subjects s ON r.subject_id = s.subject_id
          WHERE r.student_id = ?
          ORDER BY r.created_at DESC
          LIMIT 5
      `, [studentId]);

      // Calculate GPA
      const totalGradePoints = results.reduce((sum, result) => sum + result.grade_points, 0);
      const currentGPA = results.length > 0 ? totalGradePoints / results.length : 0;

      // Fetch class rank
      const [rankResult] = await pool.query(`
          SELECT COUNT(*) + 1 as classRank
          FROM (
              SELECT student_id, AVG(grade_points) as avg_gpa
              FROM results
              GROUP BY student_id
              HAVING AVG(grade_points) > (
                  SELECT AVG(grade_points)
                  FROM results
                  WHERE student_id = ?
              )
          ) as higher_ranks
      `, [studentId]);

      res.json({
          currentGPA: currentGPA.toFixed(2),
          classRank: rankResult[0]?.classRank || 'N/A',
          latestResults: results.map(r => ({
              subject: r.subject_name,
              score: r.score,
              grade: r.grade
          }))
      });
  } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
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

exports.getStudentResults = async (req, res) => {
    const { studentId } = req.params;
    const { term, year, page = 1 } = req.query;
    try {
      const limit = 10;
      const offset = (page - 1) * limit;
  
      // Log incoming parameters
      console.log('Incoming parameters:', { studentId, term, year, page });
  
      // First, check if the student exists
      const [studentCheck] = await pool.query('SELECT * FROM Students WHERE user_id = ?', [studentId]);
      if (studentCheck.length === 0) {
        console.log('Student not found for user_id:', studentId);
        return res.status(404).json({ message: 'Student not found' });
      }
  
      // If student exists, get their student_id
      const studentDbId = studentCheck[0].student_id;
      console.log('Student found. Database student_id:', studentDbId);
  
      // Base query without filters
      let query = `
        SELECT r.*, c.class_name, s.subject_name
        FROM results r
        JOIN classes c ON r.class_id = c.class_id
        JOIN subjects s ON r.subject_id = s.subject_id
        WHERE r.student_id = ?
      `;
      let queryParams = [studentDbId];
  
      // Add term and year filters if provided
      if (term && year) {
        query += ' AND r.term = ? AND r.academic_year = ?';
        queryParams.push(term, year);
      }
  
      // Add ordering and pagination
      query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
  
      console.log('Executing query:', query);
      console.log('Query params:', queryParams);
  
      const [results] = await pool.query(query, queryParams);
  
      // Log the raw results
      console.log('Raw results:', results);
  
      // Count query
      let countQuery = 'SELECT COUNT(*) as count FROM results WHERE student_id = ?';
      let countParams = [studentDbId];
  
      if (term && year) {
        countQuery += ' AND term = ? AND academic_year = ?';
        countParams.push(term, year);
      }
  
      const [totalCount] = await pool.query(countQuery, countParams);
      const totalPages = Math.ceil(totalCount[0].count / limit);
  
      console.log('Results found:', results.length);
      console.log('Total pages:', totalPages);
  
      res.json({
        results,
        currentPage: parseInt(page),
        totalPages
      });
    } catch (error) {
      console.error('Error fetching student results:', error);
      res.status(500).json({ message: 'Error fetching student results', error: error.message });
    }
  };
  
exports.getNotifications = async (req, res) => {
  const { studentId } = req.params;
  try {
      const [studentInfo] = await pool.query(`
          SELECT student_id FROM Students WHERE user_id = ?
      `, [studentId]);

      if (!studentInfo || studentInfo.length === 0) {
          return res.status(404).json({ message: 'Student not found' });
      }

      const [notifications] = await pool.query(`
          SELECT notification_id, message, created_at
          FROM Notifications
          WHERE student_id = ?
          ORDER BY created_at DESC
          LIMIT 10
      `, [studentInfo[0].student_id]);
      res.json(notifications);
  } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

exports.getStudentPerformance = async (req, res) => {
  const { studentId } = req.params;
  try {
    const [performance] = await pool.query(`
      SELECT 
        AVG(r.grade_points) as overallGPA,
        (SELECT COUNT(*) + 1 
         FROM (SELECT AVG(grade_points) as avg_gpa 
               FROM Results 
               WHERE class_id = (SELECT current_class_id FROM Students WHERE user_id = ?)
               GROUP BY student_id) as class_ranks
         WHERE avg_gpa > (SELECT AVG(grade_points) 
                          FROM Results 
                          WHERE student_id = ?)) as classRank,
        COUNT(DISTINCT r.subject_id) as totalSubjects,
        AVG(r.score) as averageScore
      FROM Results r
      WHERE r.student_id = ?
    `, [studentId, studentId, studentId]);

    if (performance.length === 0) {
      return res.status(404).json({ message: 'Performance data not found' });
    }

    res.json(performance[0]);
  } catch (error) {
    console.error('Error fetching student performance:', error);
    res.status(500).json({ message: 'Error fetching student performance', error: error.message });
  }
};

exports.downloadResults = async (req, res) => {
  const { studentId, term, academicYear } = req.params;
  // Fetch results
  const results = await fetchResultsFromDatabase(studentId, term, academicYear);
  // Generate PDF
  const pdfBuffer = await generatePDF(results);
  // Send PDF as download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=results_${studentId}_${term}_${academicYear}.pdf`);
  res.send(pdfBuffer);
};


module.exports = exports;

