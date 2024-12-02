// ... (keep existing code)

function initializeResultComponents() {
    // ... (keep existing code)

    const registerSubjectsBtn = document.getElementById('registerSubjectsBtn');
    registerSubjectsBtn.addEventListener('click', showRegisterSubjectsModal);

    const generateResultSlipBtn = document.getElementById('generateResultSlipBtn');
    generateResultSlipBtn.addEventListener('click', showGenerateResultSlipModal);

    const viewPerformanceAnalyticsBtn = document.getElementById('viewPerformanceAnalyticsBtn');
    viewPerformanceAnalyticsBtn.addEventListener('click', showPerformanceAnalyticsModal);

    // Close modal functionality
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeBtn.closest('.modal').style.display = 'none';
        });
    });
}

function showRegisterSubjectsModal() {
    const modal = document.getElementById('registerSubjectsModal');
    modal.style.display = 'block';
    fetchStudentsForSubjectRegistration();
}

async function fetchStudentsForSubjectRegistration() {
    try {
        const response = await fetch('/api/students', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Failed to fetch students');
        const students = await response.json();
        const studentSelect = document.getElementById('studentSelect');
        studentSelect.innerHTML = '<option value="">Select Student</option>' + 
            students.map(student => 
                `<option value="${student.user_id}">${student.full_name}</option>`
            ).join('');
        fetchSubjectsForRegistration();
    } catch (error) {
        console.error('Error fetching students:', error);
        alert('Failed to load students. Please try again.');
    }
}

async function fetchSubjectsForRegistration() {
    try {
        const response = await fetch('/api/subjects', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Failed to fetch subjects');
        const subjects = await response.json();
        const subjectCheckboxes = document.getElementById('subjectCheckboxes');
        subjectCheckboxes.innerHTML = subjects.map(subject => `
            <div>
                <input type="checkbox" id="subject-${subject.subject_id}" name="subjects" value="${subject.subject_id}">
                <label for="subject-${subject.subject_id}">${subject.subject_name}</label>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching subjects:', error);
        alert('Failed to load subjects. Please try again.');
    }
}

async function registerSubjects(event) {
    event.preventDefault();
    const studentId = document.getElementById('studentSelect').value;
    const selectedSubjects = Array.from(document.querySelectorAll('input[name="subjects"]:checked')).map(cb => cb.value);

    try {
        const response = await fetch('/api/results/register-subjects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ studentId, subjects: selectedSubjects })
        });

        if (!response.ok) throw new Error('Failed to register subjects');
        alert('Subjects registered successfully');
        document.getElementById('registerSubjectsModal').style.display = 'none';
    } catch (error) {
        console.error('Error registering subjects:', error);
        alert('Failed to register subjects. Please try again.');
    }
}

function showGenerateResultSlipModal() {
    const modal = document.getElementById('generateResultSlipModal');
    modal.style.display = 'block';
    fetchStudentsForResultSlip();
}

async function fetchStudentsForResultSlip() {
    try {
        const response = await fetch('/api/students', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Failed to fetch students');
        const students = await response.json();
        const studentSelect = document.getElementById('resultSlipStudentSelect');
        studentSelect.innerHTML = '<option value="">Select Student</option>' + 
            students.map(student => 
                `<option value="${student.user_id}">${student.full_name}</option>`
            ).join('');
    } catch (error) {
        console.error('Error fetching students:', error);
        alert('Failed to load students. Please try again.');
    }
}

async function generateResultSlip(event) {
    event.preventDefault();
    const studentId = document.getElementById('resultSlipStudentSelect').value;
    const term = document.getElementById('resultSlipTerm').value;
    const academicYear = document.getElementById('resultSlipAcademicYear').value;

    try {
        const response = await fetch(`/api/results/result-slip/${studentId}/${term}/${academicYear}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Failed to generate result slip');
        const resultSlip = await response.json();
        displayResultSlip(resultSlip);
    } catch (error) {
        console.error('Error generating result slip:', error);
        alert('Failed to generate result slip. Please try again.');
    }
}

function displayResultSlip(resultSlip) {
    const resultSlipContainer = document.getElementById('resultSlipContainer');
    resultSlipContainer.innerHTML = `
        <h2>Result Slip</h2>
        <p><strong>Name:</strong> ${resultSlip.studentInfo.full_name}</p>
        <p><strong>Student Number:</strong> ${resultSlip.studentInfo.student_number}</p>
        <p><strong>Class:</strong> ${resultSlip.studentInfo.class_name}</p>
        <p><strong>Term:</strong> ${resultSlip.term}</p>
        <p><strong>Academic Year:</strong> ${resultSlip.academicYear}</p>
        <table>
            <thead>
                <tr>
                    <th>Subject</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Grade Points</th>
                </tr>
            </thead>
            <tbody>
                ${resultSlip.results.map(result => `
                    <tr>
                        <td>${result.subject_name}</td>
                        <td>${result.score}</td>
                        <td>${result.grade}</td>
                        <td>${result.grade_points}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <p><strong>Total Marks:</strong> ${resultSlip.summary.totalMarks}</p>
        <p><strong>Average Score:</strong> ${resultSlip.summary.averageScore.toFixed(2)}</p>
        <p><strong>Average Grade:</strong> ${resultSlip.summary.averageGrade}</p>
        <p><strong>Average Grade Points:</strong> ${resultSlip.summary.averageGradePoints.toFixed(2)}</p>
        <p><strong>Class Position:</strong> ${resultSlip.summary.classPosition}</p>
    `;
    document.getElementById('generateResultSlipModal').style.display = 'none';
    resultSlipContainer.style.display = 'block';
}

function showPerformanceAnalyticsModal() {
    const modal = document.getElementById('performanceAnalyticsModal');
    modal.style.display = 'block';
    fetchStudentsForPerformanceAnalytics();
}

async function fetchStudentsForPerformanceAnalytics() {
    try {
        const response = await fetch('/api/students', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Failed to fetch students');
        const students = await response.json();
        const studentSelect = document.getElementById('performanceAnalyticsStudentSelect');
        studentSelect.innerHTML = '<option value="">Select Student</option>' + students.map(student => 
                `<option value="${student.user_id}">${student.full_name}</option>`
            ).join('');
    } catch (error) {
        console.error('Error fetching students:', error);
        alert('Failed to load students. Please try again.');
    }
}

async function viewPerformanceAnalytics(event) {
    event.preventDefault();
    const studentId = document.getElementById('performanceAnalyticsStudentSelect').value;

    try {
        const response = await fetch(`/api/results/performance-analytics/${studentId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Failed to fetch performance analytics');
        const analytics = await response.json();
        displayPerformanceAnalytics(analytics);
    } catch (error) {
        console.error('Error fetching performance analytics:', error);
        alert('Failed to fetch performance analytics. Please try again.');
    }
}

function displayPerformanceAnalytics(analytics) {
    const analyticsContainer = document.getElementById('performanceAnalyticsContainer');
    analyticsContainer.innerHTML = `
        <h2>Performance Analytics</h2>
        <h3>Performance Over Time</h3>
        <table>
            <thead>
                <tr>
                    <th>Term</th>
                    <th>Academic Year</th>
                    <th>Average Score</th>
                </tr>
            </thead>
            <tbody>
                ${analytics.performanceOverTime.map(performance => `
                    <tr>
                        <td>${performance.term}</td>
                        <td>${performance.academic_year}</td>
                        <td>${performance.average_score.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <h3>Subject-wise Performance</h3>
        <table>
            <thead>
                <tr>
                    <th>Subject</th>
                    <th>Average Score</th>
                </tr>
            </thead>
            <tbody>
                ${analytics.subjectPerformance.map(performance => `
                    <tr>
                        <td>${performance.subject_name}</td>
                        <td>${performance.average_score.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('performanceAnalyticsModal').style.display = 'none';
    analyticsContainer.style.display = 'block';
}

// ... (keep existing code)