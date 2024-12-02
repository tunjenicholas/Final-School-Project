const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// router.get('/dashboard/:studentId', studentController.getDashboardData);
router.get('/timetable/:studentId', studentController.getTimetable);
router.get('/assignments/:studentId', studentController.getAssignments);
router.get('/attendance/:studentId', studentController.getAttendance);
// router.get('/notifications/:studentId', studentController.getNotifications);
router.get('/dashboard/:studentId', studentController.getDashboardData);
router.get('/notifications/:studentId', studentController.getNotifications);

module.exports = router;