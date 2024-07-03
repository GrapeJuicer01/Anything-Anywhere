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
  
  async function fetchUserAddress(userId) {
    try {
      const response = await fetch(`/api/user_address`);
      if (response.ok) {
        const address = await response.json();
        const addressContainer = document.getElementById('delivery-address');
        addressContainer.innerHTML = `
          <p>${address.unit_number}, ${address.street_number} ${address.address_line1} ${address.address_line2}</p>
          <p>${address.country}, ${address.postal_code}</p>
        `;
      } else {
        throw new Error('Failed to fetch address');
      }
    } catch (error) {
      console.error('Error fetching user address:', error);
    }
  }
  
  async function fetchCartItems(userId) {
    try {
      const response = await fetch(`/api/shopping_cart`);
      if (response.ok) {
        const cartItems = await response.json();
        renderCartItems(cartItems);
      } else {
        throw new Error('Failed to fetch cart items');
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
    }
  }
  
  function renderCartItems(cartItems) {
    const cartItemsContainer = document.getElementById('cart-items');
    let totalPrice = 0;
    cartItemsContainer.innerHTML = cartItems.map(item => {
      const itemTotal = item.product_id.price * item.quantity;
      totalPrice += itemTotal;
      return `
        <div class="cart-item">
          <div class="cart-item-details">
            <img src="pictures/${item.product_id.image}" alt="${item.product_id.name}">
            <div>
              <h3>${item.product_id.name}</h3>
              <p>$${item.product_id.price.toFixed(2)}</p>
            </div>
          </div>
          <div class="cart-item-total">
            <p>$${itemTotal.toFixed(2)}</p>
          </div>
        </div>
      `;
    }).join('');
    document.getElementById('total-price').innerText = totalPrice.toFixed(2);
  }
  
  document.addEventListener('DOMContentLoaded', async () => {
    const userId = await getSessionUserId();
    if (userId) {
      fetchUserAddress(userId);
      fetchCartItems(userId);
    } else {
      alert('You need to log in first');
      window.location.href = 'login.html';
    }
  });
  