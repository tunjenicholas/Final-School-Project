const pool = require('../config/database');
const bcrypt = require('bcrypt');

async function verifyDatabase() {
    try {
        // Test database connection
        const [rows] = await pool.query('SELECT 1');
        console.log('Database connection successful');

        // Check Users table
        const [users] = await pool.query('SELECT * FROM Users');
        console.log(`Total users: ${users.length}`);

        // Check admin user
        const [adminUsers] = await pool.query('SELECT * FROM Users WHERE user_type = "admin"');
        console.log(`Admin users: ${adminUsers.length}`);

        if (adminUsers.length > 0) {
            const adminUser = adminUsers[0];
            console.log('Admin user details:');
            console.log(`Username: ${adminUser.username}`);
            console.log(`Full Name: ${adminUser.full_name}`);
            console.log(`Email: ${adminUser.email}`);
            console.log(`User Type: ${adminUser.user_type}`);
            console.log(`Is Active: ${adminUser.is_active}`);
            console.log(`Is Verified: ${adminUser.is_verified}`);
            console.log(`Password Hash exists: ${!!adminUser.password_hash}`);
        }

    } catch (error) {
        console.error('Database verification error:', error);
    } finally {
        await pool.end();
    }
}

verifyDatabase();