// A function to allow seller to login through authentication in the server
document.addEventListener('DOMContentLoaded', () => {
    const sellerLoginForm = document.getElementById('login-form');
    if (sellerLoginForm) {
      sellerLoginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission
  
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
  
        if (!email || !password) {
          alert('Please enter both email and password');
          return;
        }
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
