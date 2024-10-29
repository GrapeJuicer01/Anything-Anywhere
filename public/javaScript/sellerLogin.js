document.addEventListener('DOMContentLoaded', () => {
    // Select the form
    const sellerLoginForm = document.getElementById('login-form');
  
    // Ensure the form exists before proceeding
    if (sellerLoginForm) {
      sellerLoginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission behavior
  
        // Capture the form input values
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
  
        // Ensure that email and password inputs are present
        if (!email || !password) {
          alert('Please enter both email and password');
          return;
        }
  
        // Prepare the login request
        try {
          const response = await fetch('/api/sellers/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
  
          const data = await response.json();
          if (response.ok) {
            // Redirect or show success message
            console.log('Seller logged in successfully:', data);
            alert('Login successful!');
            window.location.href = '/sellerDashboard.html';
          } else {
            alert(data.message || 'Login failed');
          }
        } catch (error) {
          console.error('Error during login:', error);
          alert('An error occurred during login.');
        }
      });
    } else {
      console.error('Login form not found!');
    }
});
