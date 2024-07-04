async function getSessionUserId() {
    try {
        const response = await fetch('/api/session');
        if (response.ok) {
            const data = await response.json();
            return data.userId;
        } else {
            throw new Error('Not authenticated');
        }
    } catch (error) {
        console.error('Error fetching session user ID:', error);
        return null;
    }
}

async function fetchUserInfo() {
    try {
        const response = await fetch('/api/user_info');
        if (response.ok) {
            const user = await response.json();
            renderUserInfo(user);
        } else {
            throw new Error('Failed to fetch user info');
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
}

function renderUserInfo(user) {
    document.getElementById('username').value = user.username || '';
    document.getElementById('name').value = user.name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('dob').value = user.dob ? new Date(user.dob).toISOString().split('T')[0] : '';
}

async function updateUserInfo(event) {
    event.preventDefault();
    try {
        const userInfo = {
            username: document.getElementById('username').value,
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            dob: document.getElementById('dob').value,
        };

        // Validate that all fields are filled
        for (const key in userInfo) {
            if (userInfo[key] === '') {
                alert('All fields must be filled out');
                return;
            }
        }

        const response = await fetch('/api/user_info', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userInfo),
        });

        if (response.ok) {
            alert('User info updated successfully');
        } else {
            throw new Error('Failed to update user info');
        }
    } catch (error) {
        console.error('Error updating user info:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const userId = await getSessionUserId();
    if (userId) {
        fetchUserInfo();
        document.querySelector('form').addEventListener('submit', updateUserInfo);
    } else {
        alert('You need to log in first');
        window.location.href = 'login.html';
    }
});
