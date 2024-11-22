const pool = require('../config/database');

exports.getSubjects = async (req, res) => {
  try {
    const [subjects] = await pool.query('SELECT * FROM subjects');
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subjects', error: error.message });
  }
};

exports.addSubject = async (req, res) => {
  const { subject_name, subject_type } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO subjects (subject_name, subject_type) VALUES (?, ?)', [subject_name, subject_type]);
    res.status(201).json({ message: 'Subject added successfully', subjectId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Error adding subject', error: error.message });
  }
};

exports.updateSubject = async (req, res) => {
  const { subject_name, subject_type } = req.body;
  try {
    const [result] = await pool.query('UPDATE subjects SET subject_name = ?, subject_type = ? WHERE subject_id = ?', [subject_name, subject_type, req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    res.json({ message: 'Subject updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating subject', error: error.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM subjects WHERE subject_id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting subject', error: error.message });
  }
};

