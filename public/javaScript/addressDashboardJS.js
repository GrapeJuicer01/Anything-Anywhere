// Function to fetch the user's session information
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

// Function to fetch user "address" from user_address collection in database
async function fetchUserAddress() {
    try {
        const response = await fetch('/api/user_address');
        if (response.ok) {
            const address = await response.json();
            document.getElementById('unit_number').value = address.unit_number || '';
            document.getElementById('street_number').value = address.street_number || '';
            document.getElementById('address_line1').value = address.address_line1 || '';
            document.getElementById('address_line2').value = address.address_line2 || '';
            document.getElementById('postal_code').value = address.postal_code || '';
            document.getElementById('country').value = address.country || '';
        } else {
            throw new Error('Failed to fetch address');
        }
    } catch (error) {
        console.error('Error fetching user address:', error);
    }
}

// Function to update the user "address" to the user_address collection
async function updateUserAddress(event) {
    event.preventDefault(); 
    try {
        const address = {
            unit_number: document.getElementById('unit_number').value,
            street_number: document.getElementById('street_number').value,
            address_line1: document.getElementById('address_line1').value,
            address_line2: document.getElementById('address_line2').value,
            postal_code: document.getElementById('postal_code').value,
            country: document.getElementById('country').value,
        };

        const response = await fetch('/api/user_address', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(address),
        });

        if (response.ok) {
            alert('Address updated successfully');
        } else {
            throw new Error('Failed to update address');
        }
    } catch (error) {
        console.error('Error updating address:', error);
    }
}

// Call Function to update the "address"
document.addEventListener('DOMContentLoaded', async () => {
    const userId = await getSessionUserId();
    if (userId) {
        fetchUserAddress();
        document.getElementById('address-form').addEventListener('submit', updateUserAddress);
    } else {
        alert('You need to log in first');
        window.location.href = 'login.html';
    }
});
