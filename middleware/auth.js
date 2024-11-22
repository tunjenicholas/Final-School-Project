const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  console.log('Authenticating token...');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    console.log('No token provided');
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification failed:', err);
      return res.sendStatus(403);
    }
    console.log('Token verified successfully for user:', user);
    req.user = user;
    next();
  });
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    console.log('Authorizing roles...');
    if (!req.user || !roles.includes(req.user.role)) {
      console.log('User not authorized. User role:', req.user ? req.user.role : 'undefined');
      return res.sendStatus(403);
    }
    console.log('User authorized with role:', req.user.role);
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles };









// const jwt = require('jsonwebtoken');
// const pool = require('../config/database');

// exports.authenticateToken = async (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];

//   if (token == null) return res.sendStatus(401);

//   try {
//     const user = jwt.verify(token, process.env.JWT_SECRET);
    
//     // Check if the session is valid and not expired
//     const [sessions] = await pool.query(
//       'SELECT * FROM UserSessions WHERE session_id = ? AND user_id = ? AND expires_at > NOW()',
//       [token, user.id]
//     );

//     if (sessions.length === 0) {
//       return res.status(401).json({ message: 'Invalid or expired session' });
//     }

//     // Check if the user is still active
//     const [users] = await pool.query('SELECT is_active FROM Users WHERE user_id = ?', [user.id]);
    
//     if (users.length === 0 || !users[0].is_active) {
//       // Remove the invalid session
//       await pool.query('DELETE FROM UserSessions WHERE session_id = ?', [token]);
//       return res.status(403).json({ message: 'Account is deactivated or no longer exists' });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     return res.sendStatus(403);
//   }
// };


// exports.authorizeRoles = (...allowedRoles) => {
//   return async (req, res, next) => {
//     try {
//       const [users] = await pool.query('SELECT user_type FROM Users WHERE user_id = ?', [req.user.userId]);
      
//       if (users.length === 0) {
//         return res.status(404).json({ message: 'User not found' });
//       }

//       const userRole = users[0].user_type;

//       if (allowedRoles.includes(userRole)) {
//         next();
//       } else {
//         res.status(403).json({ message: 'Access denied' });
//       }
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   };
// };

