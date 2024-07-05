document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    // Check if the login form exists on the page
    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            // Create object from the loging form input
            const formData = new FormData(loginForm);
            // Convert the formData object to JSON string
            const formDataJson = JSON.stringify(Object.fromEntries(formData));
            console.log('Submitting login form:', formDataJson); 
            // Send a request to the server with formData
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: formDataJson
            });
            // Check if the response is successful
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
        // If no form formData is found
        console.error('Login form not found');
    }
});


