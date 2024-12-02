const pool = require('../config/database');

exports.createNotification = async (userId, message) => {
  try {
    await pool.query(
      'INSERT INTO Notifications (user_id, message) VALUES (?, ?)',
      [userId, message]
    );
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};
