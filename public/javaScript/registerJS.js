
// Function to allow user to register an account
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('register-form');

    if (registerForm) {
        registerForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            // Create object from the loging form input
            const formData = new FormData(registerForm);
            // Convert the FormData object to a plain object
            const formDataObject = Object.fromEntries(formData.entries());

            try {
                console.log('Sending registration request:', formDataObject);
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formDataObject)
                });
                const result = await response.json();
                if (response.ok) {
                    alert(result.message);
                    window.location.href = '/login.html';
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error('Error registering user:', error);
                alert('Error registering user');
            }
        });
    } else {
        console.error('Register form not found');
    }
});


