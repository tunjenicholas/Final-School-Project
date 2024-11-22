const pool = require('../config/database');

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const [notifications] = await pool.query(
      'SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;
    const [result] = await pool.query(
      'UPDATE Notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createNotification = async (userId, message) => {
  try {
    await pool.query(
      'INSERT INTO Notifications (user_id, message) VALUES (?, ?)',
      [userId, message]
    );
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

exports.getUnreadNotificationsCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const [result] = await pool.query(
            'SELECT COUNT(*) as count FROM Notifications WHERE user_id = ? AND is_read = false',
            [userId]
        );
        res.json({ count: result[0].count });
    } catch (error) {
        console.error('Error fetching unread notifications count:', error);
        res.status(500).json({ message: 'Server error' });
    }
};