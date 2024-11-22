const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const authController = require('./controllers/authController');
const resultController = require('./controllers/resultController');
const { authenticateToken, authorizeRoles } = require('./middleware/auth');
const notificationController = require('./controllers/notificationController');
const adminController = require('./controllers/adminController');
const reportingController = require('./controllers/reportingController');
const classController = require('./controllers/classController');
const subjectController = require('./controllers/subjectController');
const streamController = require('./controllers/streamController');
require('dotenv').config();

const db = require('./config/database');

const app = express();
const port = process.env.PORT || 3000;

// CORS middleware
app.use(cors({
  origin: 'http://localhost:5500', // or the origin of your client application
  credentials: true
}));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Request Body:', req.body);
  next();
});

app.use(express.json());
app.use(express.static('public'));

// Auth routes
app.post('/api/auth/login', authController.login);
// app.post('/api/login', authController.login);
app.post('/api/register', authenticateToken, authorizeRoles('admin'), authController.register);
app.post('/api/register-parent', authenticateToken, authorizeRoles('admin'), authController.registerParent);
app.get('/api/verify-email/:token', authController.verifyEmail);
app.post('/api/forgot-password', authController.forgotPassword);
app.post('/api/reset-password', authController.resetPassword);
app.put('/api/update-profile', authenticateToken, authController.updateProfile);
app.get('/api/user-profile', authenticateToken, authController.getUserProfile);
app.get('/api/parent-students', authenticateToken, authorizeRoles('parent'), authController.getParentStudents);

// Result management routes
app.get('/api/results', authenticateToken, resultController.getResults);
app.post('/api/results', authenticateToken, authorizeRoles('teacher', 'admin'), (req, res, next) => {
  console.log('Reached POST /api/results route');
  resultController.addResult(req, res, next);
});
app.get('/api/results/:id', authenticateToken, resultController.getResultById);
app.put('/api/results/:id', authenticateToken, authorizeRoles('teacher', 'admin'), resultController.updateResult);
app.delete('/api/results/:id', authenticateToken, authorizeRoles('admin'), resultController.deleteResult);


// Class management routes
app.get('/api/classes', authenticateToken, classController.getClasses);
app.post('/api/classes', authenticateToken, authorizeRoles('admin'), classController.addClass);
app.put('/api/classes/:id', authenticateToken, authorizeRoles('admin'), classController.updateClass);
app.delete('/api/classes/:id', authenticateToken, authorizeRoles('admin'), classController.deleteClass);
app.post('/api/classes/populate', authenticateToken, authorizeRoles('admin'), classController.populateClasses);
app.post('/api/classes/ensure', authenticateToken, classController.ensureClassesExist);



// Stream management routes
app.get('/api/streams', authenticateToken, streamController.getStreams);

// Subject management routes
app.get('/api/subjects', authenticateToken, subjectController.getSubjects);
app.post('/api/subjects', authenticateToken, authorizeRoles('admin'), subjectController.addSubject);
app.put('/api/subjects/:id', authenticateToken, authorizeRoles('admin'), subjectController.updateSubject);
app.delete('/api/subjects/:id', authenticateToken, authorizeRoles('admin'), subjectController.deleteSubject);

// Notifications Routes
app.get('/api/notifications', authenticateToken, notificationController.getNotifications);
app.put('/api/notifications/:notificationId', authenticateToken, notificationController.markNotificationAsRead);
app.get('/api/notifications/unread-count', authenticateToken, notificationController.getUnreadNotificationsCount);

// Admin routes
app.get('/api/admin/statistics', authenticateToken, adminController.getStatistics);
app.get('/api/admin/recent-activity', authenticateToken, adminController.getRecentActivity);
app.get('/api/admin/users', authenticateToken, adminController.getUsers);
app.post('/api/admin/users', authenticateToken, adminController.addUser);
app.put('/api/admin/users/:userId', authenticateToken, adminController.editUser);
app.delete('/api/admin/users/:userId', authenticateToken, adminController.deleteUser);
app.get('/api/admin/users/:userId', authenticateToken, adminController.getUser);
app.put('/api/admin/users/:userId/deactivate', authenticateToken, adminController.deactivateUser);
app.put('/api/admin/users/:userId/activate', authenticateToken, adminController.activateUser);
app.get('/api/admin/profile', authenticateToken, adminController.getProfile);
app.put('/api/admin/profile', authenticateToken, adminController.updateProfile);


// Reporting routes
app.get('/api/reporting/overall-performance', authenticateToken, reportingController.getOverallPerformance);
app.get('/api/reporting/grade-distribution', authenticateToken, reportingController.getGradeDistribution);
app.get('/api/reporting/performance-trends', authenticateToken, reportingController.getPerformanceTrends);
app.get('/api/reporting/top-performers', authenticateToken, reportingController.getTopPerformers);
app.get('/api/reporting/student/:studentId/report-card', authenticateToken, reportingController.generateStudentReportCard);


// app.get('/api/students', authenticateToken, async (req, res) => {
//   try {
//     const [students] = await db.query(`
//       SELECT u.user_id, u.full_name
//       FROM Users u
//       JOIN Students s ON u.user_id = s.user_id
//       WHERE u.user_type = 'student'
//     `);
//     res.json(students);
//   } catch (error) {
//     console.error('Error fetching students:', error);
//     res.status(500).json({ message: 'Error fetching students', error: error.message });
//   }
// });

app.get('/api/students', authenticateToken, async (req, res) => {
  try {
    const [students] = await db.query(`
      SELECT u.user_id, u.full_name
      FROM Users u
      JOIN Students s ON u.user_id = s.user_id
      WHERE u.user_type = 'student'
    `);
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


// Catch-all route for unmatched routes
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).send('Route not found');
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the reset password page
app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

app.use((req, res, next) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  next();
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});