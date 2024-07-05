document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('register-form');
    // Check if the register form exist on the page
    if (registerForm) {
        registerForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            // Create object from the loging form input
            const formData = new FormData(registerForm);
            // Convert the FormData object to a plain object
            const formDataObject = Object.fromEntries(formData.entries());

            try {
                console.log('Sending registration request:', formDataObject);
                // Send a request to the server with formData as JSON 
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formDataObject)
                });
                // Parse the JSON response from the server
                const result = await response.json();
                // Check if the response is successfull
                if (response.ok) {
                    alert(result.message);
                    window.location.href = '/login.html'; // Redirect to login page after successful registration
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error('Error registering user:', error);
                alert('Error registering user');
            }
        });
    } else {
        // If no form formData object is found
        console.error('Register form not found');
    }
});


