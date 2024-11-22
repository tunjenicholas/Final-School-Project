const db = require('../config/database');
const bcrypt = require('bcrypt');
const { sendVerificationEmail } = require('../utils/email');
const jwt = require('jsonwebtoken');

function generateStudentNumber() {
    return 'S' + Math.random().toString(36).substr(2, 8).toUpperCase();
}

function getCurrentAcademicYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

exports.getStatistics = async (req, res) => {
    try {
        const [userCounts] = await db.query(`
            SELECT 
                COUNT(*) as totalUsers,
                SUM(CASE WHEN user_type = 'student' THEN 1 ELSE 0 END) as totalStudents,
                SUM(CASE WHEN user_type = 'teacher' THEN 1 ELSE 0 END) as totalTeachers,
                SUM(CASE WHEN user_type = 'parent' THEN 1 ELSE 0 END) as totalParents
            FROM Users
        `);
        
        res.json(userCounts[0]);
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ message: 'Error fetching statistics', error: error.message });
    }
};

exports.getRecentActivity = async (req, res) => {
    try {
        const [activities] = await db.query(
            'SELECT * FROM ActivityLogs ORDER BY timestamp DESC LIMIT 10'
        );
        res.json(activities);
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ message: 'Error fetching recent activity', error: error.message });
    }
};

exports.getUser = async (req, res) => {
    const userId = req.params.userId;
    try {
        const [user] = await db.query(
            'SELECT user_id, full_name, username, email, user_type FROM Users WHERE user_id = ?',
            [userId]
        );
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
};

exports.addUser = async (req, res) => {
    const { full_name, username, email, user_type, password, grade_level, class_id } = req.body;

    if (!full_name || !username || !email || !user_type || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        const [result] = await connection.query(
            'INSERT INTO Users (full_name, username, email, user_type, password, is_active, is_verified, verification_token) VALUES (?, ?, ?, ?, ?, TRUE, FALSE, ?)',
            [full_name, username, email, user_type, hashedPassword, verificationToken]
        );
        
        const userId = result.insertId;

        if (user_type === 'student') {
            const studentNumber = generateStudentNumber();
            await connection.query(
                'INSERT INTO Students (user_id, student_number, grade_level) VALUES (?, ?, ?)',
                [userId, studentNumber, grade_level]
            );

            if (class_id) {
                const currentAcademicYear = getCurrentAcademicYear();
                await connection.query(
                    'INSERT INTO StudentClasses (user_id, class_id, academic_year) VALUES (?, ?, ?)',
                    [userId, class_id, currentAcademicYear]
                );

                await connection.query(
                    'UPDATE Students SET current_class_id = ? WHERE user_id = ?',
                    [class_id, userId]
                );

                await connection.query(
                    'UPDATE Users SET current_academic_year = ? WHERE user_id = ?',
                    [getCurrentAcademicYear(), userId]
                );
            }
        }

        await connection.query(
            'INSERT INTO ActivityLogs (user_id, action) VALUES (?, ?)',
            [req.user.id, `Added new user: ${username}`]
        );

        await sendVerificationEmail(email, verificationToken);

        await connection.commit();
        res.status(201).json({ message: 'User added successfully', userId: userId });
    } catch (error) {
        await connection.rollback();
        console.error('Error adding user:', error);
        res.status(500).json({ message: 'Error adding user', error: error.message });
    } finally {
        connection.release();
    }
};

exports.editUser = async (req, res) => {
    const { full_name, username, email, user_type } = req.body;
    const userId = req.params.userId;

    if (!full_name || !username || !email || !user_type) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        await db.query(
            'UPDATE Users SET full_name = ?, username = ?, email = ?, user_type = ? WHERE user_id = ?',
            [full_name, username, email, user_type, userId]
        );

        await db.query(
            'INSERT INTO ActivityLogs (user_id, action) VALUES (?, ?)',
            [req.user.userId, `Updated user: ${username}`]
        );

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    const userId = req.params.userId;

    try {
        const [user] = await db.query('SELECT username FROM Users WHERE user_id = ?', [userId]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await db.query('DELETE FROM Users WHERE user_id = ?', [userId]);

        await db.query(
            'INSERT INTO ActivityLogs (user_id, action) VALUES (?, ?)',
            [req.user.userId, `Deleted user: ${user[0].username}`]
        );

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

exports.getUsers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    try {
        const [users] = await db.query(
            `SELECT user_id, full_name, email, user_type, is_active 
             FROM Users 
             WHERE (full_name LIKE ? OR email LIKE ?) 
             LIMIT ? OFFSET ?`,
            [`%${search}%`, `%${search}%`, limit, offset]
        );

        const [totalUsers] = await db.query(
            `SELECT COUNT(*) as count 
             FROM Users 
             WHERE (full_name LIKE ? OR email LIKE ?)`,
            [`%${search}%`, `%${search}%`]
        );

        const totalPages = Math.ceil(totalUsers[0].count / limit);

        res.json({
            users,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

exports.deactivateUser = async (req, res) => {
    const userId = req.params.userId;

    try {
        const [user] = await db.query('SELECT username FROM Users WHERE user_id = ?', [userId]);
        
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const [result] = await db.query('UPDATE Users SET is_active = 0 WHERE user_id = ?', [userId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await db.query(
            'INSERT INTO ActivityLogs (user_id, action) VALUES (?, ?)',
            [req.user.id, `Deactivated user: ${user[0].username}`]
        );

        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Error deactivating user:', error);
        res.status(500).json({ message: 'Error deactivating user', error: error.message });
    }
};

exports.activateUser = async (req, res) => {
    const userId = req.params.userId;

    try {
        const [user] = await db.query('SELECT username FROM Users WHERE user_id = ?', [userId]);
        
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const [result] = await db.query('UPDATE Users SET is_active = 1 WHERE user_id = ?', [userId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await db.query(
            'INSERT INTO ActivityLogs (user_id, action) VALUES (?, ?)',
            [req.user.id, `Activated user: ${user[0].username}`]
        );

        res.json({ message: 'User activated successfully' });
    } catch (error) {
        console.error('Error activating user:', error);
        res.status(500).json({ message: 'Error activating user', error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const [user] = await db.query(
            'SELECT user_id, full_name, username, email, user_type FROM Users WHERE user_id = ?',
            [req.user.id]
        );

        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user[0]);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    const { full_name, username, email } = req.body;

    if (!full_name || !username || !email) {
        return res.status(400).json({ message: 'Full name, username, and email are required' });
    }

    try {
        const [existingUser] = await db.query(
            'SELECT user_id FROM Users WHERE username = ? AND user_id != ?',
            [username, req.user.id]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Username is already taken' });
        }

        await db.query(
            'UPDATE Users SET full_name = ?, username = ?, email = ? WHERE user_id = ?',
            [full_name, username, email, req.user.id]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};