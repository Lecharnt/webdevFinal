// auth.js - Frontend authentication functions

// Handle Signup Form
async function signup() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('Please fill all fields');
        return;
    }

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();
        alert(result.message);

        if (result.success) {
            window.location.href = '/login'; // Redirect to login page
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Server error. Please try again.');
    }
}

// Handle Login Form
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('Please fill all fields');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();
        alert(result.message);

        if (result.success) {
            // Login successful - stay on same page or redirect
            window.location.href = '/'; // Go to main page
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Server error. Please try again.');
    }
}

// Check login status on page load
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/check-login');
        const result = await response.json();

        if (result.loggedIn) {
            // User is logged in
            return result.username;
        }
        return null;
    } catch (error) {
        console.error('Check login error:', error);
        return null;
    }
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/api/logout');
        const result = await response.json();

        if (result.success) {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Update UI based on login status
async function updateUIForLogin() {
    const username = await checkLoginStatus();

    if (username) {
        // Create logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout (' + username + ')';
        logoutBtn.onclick = logout;
        logoutBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            background: #f44336;
            color: white;
            border: none;
            cursor: pointer;
        `;
        document.body.appendChild(logoutBtn);
    }
}

// Call this when page loads
window.addEventListener('DOMContentLoaded', updateUIForLogin);