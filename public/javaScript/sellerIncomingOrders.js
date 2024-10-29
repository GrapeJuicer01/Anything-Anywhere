// Fetch the session to get the seller's ID (assuming each seller has a unique session)
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

// Fetch orders that are specifically for the seller
async function fetchOrders() {
    try {
        const response = await fetch('/api/orders');
        if (response.ok) {
            const orders = await response.json();
            renderOrders(orders);
        } else {
            throw new Error('Failed to fetch orders');
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}

function renderOrders(orders) {
    const orderContainer = document.getElementById('incoming-order');
    orderContainer.innerHTML = orders.map(order => `
        <div class="order-item">
            <h3>Order ID: ${order._id}</h3>
            <p>Order Date: ${new Date(order.order_date).toLocaleDateString()}</p>
            <p>Payment Method: ${order.payment_method}</p>
            <p>Order Status: ${order.order_status}</p>
            <h4>Shipping Address:</h4>
            <p>${order.shipping_address.unit_number}, ${order.shipping_address.street_number} ${order.shipping_address.address_line1} ${order.shipping_address.address_line2}</p>
            <p>${order.shipping_address.city}, ${order.shipping_address.postal_code}, ${order.shipping_address.country}</p>
            <ul>
                ${order.orderItems.map(item => `
                    <li>
                        <img src="pictures/${item.product_id.image}" alt="${item.product_id.name}">
                        <p>${item.product_id.name}</p>
                        <p>Quantity: ${item.quantity}</p>
                        <p>Price: $${item.price.toFixed(2)}</p>
                    </li>
                `).join('')}
            </ul>
            <button onclick="confirmOrderReceived('${order._id}')">Order Received</button>
        </div>
    `).join('');
}

// Call fetchOrders when the page loads
document.addEventListener('DOMContentLoaded', fetchOrders);


// Placeholder for order confirmation functionality
async function confirmOrderReceived(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}/confirm`, { method: 'PUT' });
        if (response.ok) {
            alert('Order confirmed as received!');
            fetchOrders(); // Refresh the order list after confirmation
        } else {
            alert('Failed to confirm order');
        }
    } catch (error) {
        console.error('Error confirming order:', error);
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    const userId = await getSessionUserId();
    if (userId) {
        fetchOrders();
    } else {
        alert('You need to log in first');
        window.location.href = 'login.html';
    }
});
