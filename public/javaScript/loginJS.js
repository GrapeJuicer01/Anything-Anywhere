// Function to allow login in for users (shopper)
document.addEventListener('DOMContentLoaded', function () {
    // fetch element from the form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const formData = new FormData(loginForm);
            const formDataJson = JSON.stringify(Object.fromEntries(formData));
            console.log('Submitting login form:', formDataJson); 
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: formDataJson
            });
            if (response.ok) {
                console.log('Login successful');
                alert('Logged in successfully');
                window.location.href = '/dashboard.html';
            } else {
                console.log('Login failed'); 
                alert('Login failed');
            }
        });
    } else {
        console.error('Login form not found');
    }
});


