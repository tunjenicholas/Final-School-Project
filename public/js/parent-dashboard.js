document.addEventListener('DOMContentLoaded', () => {
    fetchChildrenResults();
    fetchChildrenPerformance();
    fetchChildrenAttendance();
});

async function fetchChildrenResults() {
    try {
        const response = await fetch('/api/parent/children-results');
        const data = await response.json();
        const tableBody = document.getElementById('latest-results-body');
        tableBody.innerHTML = data.slice(0, 5).map(result => `
            <tr>
                <td>${result.student_name}</td>
                <td>${result.subject_name}</td>
                <td>${result.score}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error fetching children results:', error);
    }
}

async function fetchChildrenPerformance() {
    try {
        const response = await fetch('/api/parent/children-performance');
        const data = await response.json();
        const tableBody = document.getElementById('performance-overview-body');
        tableBody.innerHTML = data.map(performance => `
            <tr>
                <td>${performance.student_name}</td>
                <td>${performance.average_score.toFixed(2)}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error fetching children performance:', error);
    }
}

async function fetchChildrenAttendance() {
    try {
        const response = await fetch('/api/parent/children-attendance');
        const data = await response.json();
        const tableBody = document.getElementById('recent-attendance-body');
        tableBody.innerHTML = data.slice(0, 5).map(attendance => `
            <tr>
                <td>${attendance.student_name}</td>
                <td>${new Date(attendance.date).toLocaleDateString()}</td>
                <td>${attendance.is_present ? 'Present' : 'Absent'}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error fetching children attendance:', error);
    }
}