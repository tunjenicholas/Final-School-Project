const pool = require('../config/database');

exports.getClasses = async (req, res) => {
  try {
    const [classes] = await pool.query(`
      SELECT c.*, s.stream_name, s.form_name
      FROM classes c
      LEFT JOIN streams s ON c.stream_id = s.stream_id
      ORDER BY s.form_name, s.stream_name, c.class_name
    `);
    console.log('Classes fetched:', classes.length);
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Error fetching classes', error: error.message });
  }
};

exports.addClass = async (req, res) => {
  const { class_name, stream_id } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO classes (class_name, stream_id) VALUES (?, ?)', [class_name, stream_id]);
    res.status(201).json({ message: 'Class added successfully', classId: result.insertId });
  } catch (error) {
    console.error('Error adding class:', error);
    res.status(500).json({ message: 'Error adding class', error: error.message });
  }
};

exports.updateClass = async (req, res) => {
  const { class_name, stream_id } = req.body;
  const { id } = req.params;
  try {
    const [result] = await pool.query('UPDATE classes SET class_name = ?, stream_id = ? WHERE class_id = ?', [class_name, stream_id, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json({ message: 'Class updated successfully' });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ message: 'Error updating class', error: error.message });
  }
};

exports.deleteClass = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM classes WHERE class_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ message: 'Error deleting class', error: error.message });
  }
};

exports.populateClasses = async (req, res) => {
  try {
    const [streams] = await pool.query('SELECT * FROM streams');

    for (const stream of streams) {
      const className = `${stream.form_name} ${stream.stream_name}`;
      await pool.query(
        'INSERT INTO classes (class_name, stream_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE class_name = ?',
        [className, stream.stream_id, className]
      );
    }

    res.json({ message: 'Classes populated successfully' });
  } catch (error) {
    console.error('Error populating classes:', error);
    res.status(500).json({ message: 'Error populating classes', error: error.message });
  }
};

exports.ensureClassesExist = async (req, res) => {
  try {
    const [classCount] = await pool.query('SELECT COUNT(*) as count FROM classes');
    
    if (classCount[0].count === 0) {
      console.log('No classes found. Creating default classes...');
      const defaultClasses = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];
      for (const className of defaultClasses) {
        await pool.query('INSERT INTO classes (class_name) VALUES (?)', [className]);
      }
      console.log('Default classes created');
    } else {
      console.log('Classes already exist');
    }

    res.json({ message: 'Classes checked and populated if necessary' });
  } catch (error) {
    console.error('Error ensuring classes exist:', error);
    res.status(500).json({ message: 'Error ensuring classes exist', error: error.message });
  }
};

