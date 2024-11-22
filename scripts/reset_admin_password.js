const bcrypt = require('bcrypt');
const pool = require('../config/database');

async function resetAdminPassword() {
    const newPassword = 'admin123'; // You can change this to any password you want
    const saltRounds = 10;

    try {
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        console.log(`New hashed password: ${hashedPassword}`);

        const [result] = await pool.query(
            'UPDATE Users SET password_hash = ? WHERE username = ? AND user_type = ?',
            [hashedPassword, 'admin', 'admin']
        );

        if (result.affectedRows > 0) {
            console.log('Admin password updated successfully');
        } else {
            console.log('No admin user found or password was not updated');
        }
    } catch (error) {
        console.error('Error resetting admin password:', error);
    } finally {
        await pool.end();
    }
}

resetAdminPassword();