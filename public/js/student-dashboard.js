// Global variables
let currentUser = null;

// Helper function to make authenticated API calls
async function fetchAPI(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    };
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
        return;
    }
    
    return response.json();
}

// Function to load dashboard data
async function loadDashboardData() {
    try {
        const data = await fetchAPI(`/api/students/dashboard/${currentUser.id}`);
        document.getElementById('currentGPA').textContent = data.gpa.toFixed(2);
        document.getElementById('attendanceRate').textContent = `${data.attendanceRate.toFixed(2)}%`;
        document.getElementById('upcomingAssignments').textContent = data.upcomingAssignments;
        document.getElementById('nextExam').textContent = data.nextExam ? `${data.nextExam.subject_name} - ${moment(data.nextExam.exam_date).format('MMM D, YYYY')}` : 'No upcoming exams';
        
        const recentActivityList = document.getElementById('recentActivityList');
        recentActivityList.innerHTML = data.recentActivity.map(activity => `
            <li>${activity.activity_type} - ${moment(activity.activity_date).fromNow()}</li>
        `).join('');
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Function to load results
async function loadResults() {
    try {
        const results = await fetchAPI(`/api/results/student-subjects/${currentUser.id}`);
        const resultsContent = document.getElementById('resultsContent');
        resultsContent.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Score</th>
                        <th>Grade</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map(result => `
                        <tr>
                            <td>${result.subject_name}</td>
                            <td>${result.score}</td>
                            <td>${result.grade}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading results:', error);
    }
}

// Function to load subjects
async function loadSubjects() {
    try {
        const subjects = await fetchAPI(`/api/results/student-subjects/${currentUser.id}`);
        const subjectsContent = document.getElementById('subjectsContent');
        subjectsContent.innerHTML = `
            <ul>
                ${subjects.map(subject => `<li>${subject.subject_name}</li>`).join('')}
            </ul>
        `;
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

// Function to load attendance
async function loadAttendance() {
    try {
        const attendance = await fetchAPI(`/api/students/attendance/${currentUser.id}`);
        const attendanceContent = document.getElementById('attendanceContent');
        attendanceContent.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${attendance.map(record => `
                        <tr>
                            <td>${moment(record.date).format('MMM D, YYYY')}</td>
                            <td>${record.is_present ? 'Present' : 'Absent'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading attendance:', error);
    }
}

// Function to load notifications
async function loadNotifications() {
    try {
        const notifications = await fetchAPI(`/api/students/notifications/${currentUser.id}`);
        const notificationList = document.getElementById('notificationList');
        notificationList.innerHTML = notifications.map(notification => `
            <li>${notification.message} - ${moment(notification.created_at).fromNow()}</li>
        `).join('');
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Function to update user profile
async function updateProfile(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const updatedProfile = Object.fromEntries(formData.entries());
    
    try {
        await fetchAPI('/api/auth/update-profile', {
            method: 'PUT',
            body: JSON.stringify(updatedProfile)
        });
        alert('Profile updated successfully');
        loadUserInfo();
        document.getElementById('profileModal').style.display = 'none';
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
    }
}

// Function to load user info
async function loadUserInfo() {
    try {
        currentUser = await fetchAPI('/api/auth/user-profile');
        document.getElementById('username').textContent = currentUser.fullName;
        document.getElementById('profileFullName').value = currentUser.fullName;
        document.getElementById('profileEmail').value = currentUser.email;
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Function to initialize the dashboard
async function initDashboard() {
    await loadUserInfo();
    await loadDashboardData();
    await loadNotifications();

    // Set up navigation
    const navLinks = document.querySelectorAll('.left-sidebar a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });

    // Set up profile form
    document.getElementById('profileForm').addEventListener('submit', updateProfile);

    // Set up logout
    document.getElementById('logout').addEventListener('click', logout);

    // Set up view profile
    document.getElementById('viewProfile').addEventListener('click', () => {
        document.getElementById('profileModal').style.display = 'block';
    });

    // Set up close modal
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('profileModal').style.display = 'none';
    });
}

// Function to show a specific section
function showSection(sectionId) {
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => {
        section.style.display = section.id === sectionId ? 'block' : 'none';
    });

    const navLinks = document.querySelectorAll('.left-sidebar a');
    navLinks.forEach(link => {
        link.parentElement.classList.toggle('active', link.getAttribute('href') === `#${sectionId}`);
    });

    // Load section-specific data
    switch (sectionId) {
        case 'results':
            loadResults();
            break;
        case 'subjects':
            loadSubjects();
            break;
        case 'attendance':
            loadAttendance();
            break;
    }
}

// Function to toggle dropdown
function toggleDropdown() {
    document.getElementById('profileDropdown').classList.toggle('show');
}

// Function to handle logout
async function logout() {
    try {
        await fetchAPI('/api/auth/logout', { method: 'POST' });
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Error logging out:', error);
        alert('Failed to logout. Please try again.');
    }
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
    if (!event.target.matches('.avatar')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);