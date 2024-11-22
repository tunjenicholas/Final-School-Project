async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            window.location.href = '/dashboard.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}

async function register() {
    const username = document.getElementById('newUsername').value;
    const email = document.getElementById('newEmail').value;
    const password = document.getElementById('newPassword').value;
    const fullName = document.getElementById('newFullName').value;
    const role = document.getElementById('newRole').value;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ username, email, password, fullName, role }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            // Clear the form
            document.getElementById('registrationForm').reset();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}

async function forgotPassword() {
    const email = document.getElementById('forgotEmail').value;

    try {
        const response = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}

async function resetPassword() {
    const token = new URLSearchParams(window.location.search).get('token');
    const newPassword = document.getElementById('newPassword').value;

    try {
        const response = await fetch('/api/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, newPassword }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            window.location.href = '/login.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}

async function updateProfile() {
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;

    try {
        const response = await fetch('/api/update-profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ fullName, email }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            loadUserProfile();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}

async function loadUserProfile() {
    try {
        const response = await fetch('/api/user-profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('fullName').value = data.full_name;
            document.getElementById('email').value = data.email;
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = '/login.html';
}

// Load user profile when the profile page is loaded
if (window.location.pathname === '/profile.html') {
    loadUserProfile();
}