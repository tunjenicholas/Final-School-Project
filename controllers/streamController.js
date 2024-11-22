const db = require('../config/database');

exports.getStreams = async (req, res) => {
  try {
    const [streams] = await db.query('SELECT * FROM streams ORDER BY form_name, stream_name');
    res.json(streams);
  } catch (error) {
    console.error('Error fetching streams:', error);
    res.status(500).json({ message: 'Error fetching streams', error: error.message });
  }
};