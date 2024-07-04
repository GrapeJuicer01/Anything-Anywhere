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
    const orderHistoryContainer = document.getElementById('pending-order');
    orderHistoryContainer.innerHTML = orders.map(order => `
        <div class="order-item">
            <h3>Order ID: ${order._id}</h3>
            <p>Order Date: ${new Date(order.order_date).toLocaleDateString()}</p>
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

async function confirmOrderReceived(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}/confirm`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_status: 'Received' })
        });
        if (response.ok) {
            alert('Order status updated to Received');
            fetchOrders(); // Refresh orders after update
        } else {
            throw new Error('Failed to update order status');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const userId = await getSessionUserId();
    if (userId) {
        fetchOrders();
    } else {
        alert('You need to log in first');
        window.location.href = 'login.html';
    }
});