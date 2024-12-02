const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { authenticateToken, authorizeRoles } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
require('dotenv').config();

const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const resultController = require('./controllers/resultController');
const notificationController = require('./controllers/notificationController');
const reportingController = require('./controllers/reportingController');
const classController = require('./controllers/classController');
const subjectController = require('./controllers/subjectController');
const streamController = require('./controllers/streamController');
const studentController = require('./controllers/studentController');
const teacherController = require('./controllers/teacherController');
const parentController = require('./controllers/parentController');




// Teacher routes

// Parent routes
app.get('/api/parents/children/performance-metrics', authenticateToken, authorizeRoles('parent'), parentController.getChildrenPerformanceMetrics);
app.get('/api/parents/children/result-slip/:studentId/:term/:academicYear', authenticateToken, authorizeRoles('parent'), parentController.downloadChildResultSlip);

// Admin routes




const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5500',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Auth routes
app.post('/api/auth/login', authController.login);
app.post('/api/auth/register', authenticateToken, authorizeRoles('admin'), authController.register);
app.get('/api/auth/verify-email/:token', authController.verifyEmail);
app.post('/api/auth/forgot-password', authController.forgotPassword);
app.post('/api/auth/reset-password', authController.resetPassword);
app.put('/api/auth/update-profile', authenticateToken, authController.updateProfile);
app.get('/api/auth/user-profile', authenticateToken, authController.getUserProfile);
app.post('/api/auth/logout', authenticateToken, authController.logout);
app.put('/api/auth/update-personal-info', authenticateToken, authController.updatePersonalInfo);



// Admin routes
app.get('/api/admin/statistics', authenticateToken, authorizeRoles('admin'), adminController.getStatistics);
app.get('/api/admin/recent-activity', authenticateToken, authorizeRoles('admin'), adminController.getRecentActivity);
app.get('/api/admin/users', authenticateToken, authorizeRoles('admin'), adminController.getUsers);
app.post('/api/admin/users', authenticateToken, authorizeRoles('admin'), adminController.addUser);
app.put('/api/admin/users/:userId', authenticateToken, authorizeRoles('admin'), adminController.editUser);
app.delete('/api/admin/users/:userId', authenticateToken, authorizeRoles('admin'), adminController.deleteUser);
app.get('/api/admin/users/:userId', authenticateToken, authorizeRoles('admin'), adminController.getUser);
app.put('/api/admin/users/:userId/deactivate', authenticateToken, authorizeRoles('admin'), adminController.deactivateUser);
app.put('/api/admin/users/:userId/activate', authenticateToken, authorizeRoles('admin'), adminController.activateUser);
app.get('/api/admin/unverified-users', authenticateToken, authorizeRoles('admin'), adminController.getUnverifiedUsers);
app.put('/api/admin/users/:userId/verify', authenticateToken, authorizeRoles('admin'), adminController.verifyUser); 
app.post('/api/admin/assign-role', authenticateToken, authorizeRoles('admin'), adminController.assignRole);
app.post('/api/admin/approve-results', authenticateToken, authorizeRoles('admin'), adminController.approveResults);
app.post('/api/admin/lock-results', authenticateToken, authorizeRoles('admin'), adminController.lockResults);
app.post('/api/admin/assign-subject', authenticateToken, authorizeRoles('admin'), adminController.assignSubjectToTeacher);
app.post('/api/admin/send-notification', authenticateToken, authorizeRoles('admin'), adminController.sendNotification);


// Result management routes
app.get('/api/results', authenticateToken, resultController.getResults);
app.post('/api/results', authenticateToken, authorizeRoles('teacher', 'admin'), resultController.addResult);
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

// Student Routes
app.get('/api/students/:studentId/class', authenticateToken, studentController.getStudentClass);
app.get('/api/students/:studentId/dashboard', authenticateToken, studentController.getDashboardData);
app.get('/api/students/:studentId/subjects', authenticateToken, studentController.getStudentSubjects);
app.get('/api/students/:studentId/results', authenticateToken, studentController.getStudentResults);
app.get('/api/students/:studentId/results/:term/:academicYear/download', authenticateToken, studentController.downloadResults);
app.get('/api/students/profile', studentController.getStudentProfile);


// Subject management routes
app.get('/api/subjects', authenticateToken, subjectController.getSubjects);
app.post('/api/subjects', authenticateToken, authorizeRoles('admin'), subjectController.addSubject);
app.put('/api/subjects/:id', authenticateToken, authorizeRoles('admin'), subjectController.updateSubject);
app.delete('/api/subjects/:id', authenticateToken, authorizeRoles('admin'), subjectController.deleteSubject);

// Notifications Routes
app.get('/api/notifications', authenticateToken, notificationController.getNotifications);
app.put('/api/notifications/:notificationId', authenticateToken, notificationController.markNotificationAsRead);
app.get('/api/notifications/unread-count', authenticateToken, notificationController.getUnreadNotificationsCount);

// Reporting routes
app.get('/api/reporting/overall-performance', authenticateToken, reportingController.getOverallPerformance);
app.get('/api/reporting/grade-distribution', authenticateToken, reportingController.getGradeDistribution);
app.get('/api/reporting/performance-trends', authenticateToken, reportingController.getPerformanceTrends);
app.get('/api/reporting/top-performers', authenticateToken, reportingController.getTopPerformers);
app.get('/api/reporting/student/:studentId/report-card', authenticateToken, reportingController.generateStudentReportCard);

// Teachers route
app.get('/api/teachers/class/:classId/performance/:term/:academicYear', authenticateToken, authorizeRoles('teacher'), teacherController.getClassPerformance);
app.get('/api/teachers/class/:classId/report/:term/:academicYear', authenticateToken, authorizeRoles('teacher'), teacherController.generateClassReport);
app.get('/api/teachers/result-slip/:studentId/:term/:academicYear', authenticateToken, authorizeRoles('teacher'), teacherController.downloadResultSlip);


// parent routes
app.get('/api/parents/children/results', authenticateToken, authorizeRoles('parent'), parentController.getChildrenResults);
app.get('/api/parents/children/performance-metrics', authenticateToken, authorizeRoles('parent'), parentController.getChildrenPerformanceMetrics);
app.get('/api/parents/children/result-slip/:studentId/:term/:academicYear', authenticateToken, authorizeRoles('parent'), parentController.downloadChildResultSlip);


// Students route
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

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

// Serve static files
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Error handling middleware
app.use(errorHandler);

// Catch-all route for unmatched routes
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).send('Route not found');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});