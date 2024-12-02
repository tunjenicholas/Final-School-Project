const pool = require('../config/database');

exports.getChildrenResults = async (req, res) => {
  const parentId = req.user.id;
  try {
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
      JOIN parentstudent ps ON u.user_id = ps.student_id
      JOIN students st ON u.user_id = st.user_id
      JOIN classes c ON st.current_class_id = c.class_id
      JOIN results r ON u.user_id = r.student_id
      JOIN subjects s ON r.subject_id = s.subject_id
      WHERE ps.parent_id = ?
      ORDER BY u.full_name, r.academic_year, r.term, s.subject_name
    `, [parentId]);

    res.json(results);
  } catch (error) {
    console.error('Error fetching children results:', error);
    res.status(500).json({ message: 'Error fetching children results', error: error.message });
  }
};

exports.getChildrenPerformanceMetrics = async (req, res) => {
  const parentId = req.user.id;
  try {
    const [metrics] = await pool.query(`
      SELECT 
        u.full_name as student_name,
        c.class_name,
        AVG(r.score) as average_score,
        (SELECT COUNT(*) + 1 
         FROM (SELECT AVG(score) as avg_score 
               FROM Results 
               WHERE class_id = s.current_class_id
               GROUP BY student_id) as class_ranks
         WHERE avg_score > (SELECT AVG(score) 
                            FROM Results 
                            WHERE student_id = s.user_id)) as class_rank
      FROM Users u
      JOIN ParentStudent ps ON u.user_id = ps.student_id
      JOIN Students s ON u.user_id = s.user_id
      JOIN Classes c ON s.current_class_id = c.class_id
      LEFT JOIN Results r ON u.user_id = r.student_id
      WHERE ps.parent_id = ?
      GROUP BY u.user_id
    `, [parentId]);

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching children performance metrics:', error);
    res.status(500).json({ message: 'Error fetching children performance metrics', error: error.message });
  }
};

exports.downloadChildResultSlip = async (req, res) => {
  const { studentId, term, academicYear } = req.params;
  const parentId = req.user.id;

  try {
    // Check if the student is a child of the parent
    const [childCheck] = await pool.query(
      'SELECT * FROM ParentStudent WHERE parent_id = ? AND student_id = ?',
      [parentId, studentId]
    );

    if (childCheck.length === 0) {
      return res.status(403).json({ message: 'Unauthorized access to student results' });
    }

    // Fetch student details and results
    const [studentInfo] = await pool.query(`
      SELECT u.full_name, s.student_number, c.class_name
      FROM Users u
      JOIN Students s ON u.user_id = s.user_id
      JOIN Classes c ON s.current_class_id = c.class_id
      WHERE u.user_id = ?
    `, [studentId]);

    const [results] = await pool.query(`
      SELECT s.subject_name, r.score, r.grade
      FROM Results r
      JOIN Subjects s ON r.subject_id = s.subject_id
      WHERE r.student_id = ? AND r.term = ? AND r.academic_year = ?
    `, [studentId, term, academicYear]);

    // Generate PDF
    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      let pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=result_slip_${studentInfo[0].student_number}_${term}_${academicYear}.pdf`);
      res.send(pdfData);
    });

    // Add content to PDF
    doc.fontSize(18).text('Student Result Slip', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${studentInfo[0].full_name}`);
    doc.text(`Student Number: ${studentInfo[0].student_number}`);
    doc.text(`Class: ${studentInfo[0].class_name}`);
    doc.text(`Term: ${term}`);
    doc.text(`Academic Year: ${academicYear}`);
    doc.moveDown();

    // Add results table
    const tableTop = 200;
    const tableLeft = 50;
    const rowHeight = 20;
    const colWidths = [200, 100, 100];

    doc.font('Helvetica-Bold');
    doc.text('Subject', tableLeft, tableTop);
    doc.text('Score', tableLeft + colWidths[0], tableTop);
    doc.text('Grade', tableLeft + colWidths[0] + colWidths[1], tableTop);
    doc.font('Helvetica');

    results.forEach((result, i) => {
      const y = tableTop + (i + 1) * rowHeight;
      doc.text(result.subject_name, tableLeft, y);
      doc.text(result.score.toString(), tableLeft + colWidths[0], y);
      doc.text(result.grade, tableLeft + colWidths[0] + colWidths[1], y);
    });

    doc.end();
  } catch (error) {
    console.error('Error generating result slip:', error);
    res.status(500).json({ message: 'Error generating result slip', error: error.message });
  }
};
