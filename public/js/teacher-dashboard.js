document.addEventListener('DOMContentLoaded', () => {
    fetchClasses();
    fetchSubjects();
    document.getElementById('class-select').addEventListener('change', handleClassChange);
    document.getElementById('generate-report-btn').addEventListener('click', handleGenerateReport);
});

async function fetchClasses() {
    try {
        const response = await fetch('/api/teacher/classes');
        const classes = await response.json();
        const select = document.getElementById('class-select');
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.class_id;
            option.textContent = cls.class_name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching classes:', error);
    }
}

async function fetchSubjects() {
    try {
        const response = await fetch('/api/teacher/subjects');
        const subjects = await response.json();
        const select = document.getElementById('subject-select');
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.subject_id;
            option.textContent = subject.subject_name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching subjects:', error);
    }
}

async function handleClassChange(event) {
    const classId = event.target.value;
    if (classId) {
        try {
            const response = await fetch(`/api/teacher/class-performance/${classId}`);
            const performance = await response.json();
            displayClassPerformance(performance);
        } catch (error) {
            console.error('Error fetching class performance:', error);
        }
    } else {
        document.getElementById('class-performance').style.display = 'none';
    }
}

function displayClassPerformance(performance) {
    const tableBody = document.getElementById('class-performance-body');
    tableBody.innerHTML = `
        <tr>
            <td>Average Score</td>
            <td>${performance.average_score.toFixed(2)}</td>
        </tr>
        <tr>
            <td>Total Students</td>
            <td>${performance.total_students}</td>
        </tr>
        <tr>
            <td>Grade Distribution</td>
            <td>
                A: ${performance.a_count}, 
                B: ${performance.b_count}, 
                C: ${performance.c_count}, 
                D: ${performance.d_count}, 
                E: ${performance.e_count}
            </td>
        </tr>
    `;
    document.getElementById('class-performance').style.display = 'block';
}

async function handleGenerateReport() {
    const classId = document.getElementById('class-select').value;
    if (classId) {
        try {
            const response = await fetch(`/api/teacher/class-report/${classId}`);
            const report = await response.json();
            displayClassReport(report);
        } catch (error) {
            console.error('Error generating class report:', error);
        }
    } else {
        alert('Please select a class before generating a report.');
    }
}

function displayClassReport(report) {
    const tableBody = document.getElementById('class-report-body');
    tableBody.innerHTML = report.students.map((student, index) => `
        <tr>
            <td>${student.rank}</td>
            <td>${student.full_name}</td>
            <td>${student.average_score.toFixed(2)}</td>
            <td>${student.grade}</td>
        </tr>
    `).join('');
    document.getElementById('class-report').style.display = 'block';
}