const pool = require('../config/database');
const { calculateGrade, calculateGradePoints } = require('../utils/grading');
const PDFDocument = require('pdfkit');

exports.getClassPerformance = async (req, res) => {
  const { classId, term, academicYear } = req.params;
  try {
    const [performance] = await pool.query(`
      SELECT 
        AVG(r.score) as average_score,
        COUNT(DISTINCT r.student_id) as total_students
      FROM results r
      JOIN students s ON r.student_id = s.user_id
      WHERE s.current_class_id = ? AND r.term = ? AND r.academic_year = ?
    `, [classId, term, academicYear]);

    const averageScore = performance[0].average_score;
    const averageGrade = calculateGrade(averageScore);
    const averageGradePoints = calculateGradePoints(averageGrade);

    const [gradeDistribution] = await pool.query(`
      SELECT r.grade, COUNT(*) as count
      FROM results r
      JOIN students s ON r.student_id = s.user_id
      WHERE s.current_class_id = ? AND r.term = ? AND r.academic_year = ?
      GROUP BY r.grade
    `, [classId, term, academicYear]);

    res.json({
      averageScore,
      averageGrade,
      averageGradePoints,
      totalStudents: performance[0].total_students,
      gradeDistribution
    });
  } catch (error) {
    console.error('Error fetching class performance:', error);
    res.status(500).json({ message: 'Error fetching class performance', error: error.message });
  }
};

exports.generateClassReport = async (req, res) => {
  const { classId, term, academicYear } = req.params;
  try {
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

    const report = {
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

    res.json(report);
  } catch (error) {
    console.error('Error generating class report:', error);
    res.status(500).json({ message: 'Error generating class report', error: error.message });
  }
};

exports.getTeacherClasses = async (req, res) => {
  const teacherId = req.user.id;
  try {
    const [classes] = await pool.query(`
      SELECT DISTINCT c.class_id, c.class_name, s.stream_name, s.form_name
      FROM classes c
      JOIN streams s ON c.stream_id = s.stream_id
      JOIN results r ON c.class_id = r.class_id
      WHERE r.teacher_id = ?
    `, [teacherId]);

    res.json(classes);
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ message: 'Error fetching teacher classes', error: error.message });
  }
};

exports.getTeacherSubjects = async (req, res) => {
  const teacherId = req.user.id;
  try {
    const [subjects] = await pool.query(`
      SELECT DISTINCT s.subject_id, s.subject_name
      FROM subjects s
      JOIN results r ON s.subject_id = r.subject_id
      WHERE r.teacher_id = ?
    `, [teacherId]);

    res.json(subjects);
  } catch (error) {
    console.error('Error fetching teacher subjects:', error);
    res.status(500).json({ message: 'Error fetching teacher subjects', error: error.message });
  }
};

exports.downloadResultSlip = async (req, res) => {
  const { studentId, term, academicYear } = req.params;
  
  try {
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
