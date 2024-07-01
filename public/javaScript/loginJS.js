document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const formData = new FormData(loginForm);
            const formDataJson = JSON.stringify(Object.fromEntries(formData));
            console.log('Submitting login form:', formDataJson); // Log form data

            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: formDataJson
            });

            if (response.ok) {
                console.log('Login successful'); // Log successful response
                alert('Logged in successfully');
                window.location.href = '/dashboard.html'; // Redirect to the user dashboard
            } else {
                console.log('Login failed'); // Log failed response
                alert('Login failed');
            }
        });
    } else {
        console.error('Login form not found');
    }
});


