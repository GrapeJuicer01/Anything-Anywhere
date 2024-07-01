async function getCartItems() {
    try {
        const response = await fetch('/api/shopping_cart');
        const cartItems = await response.json();
        renderCartItems(cartItems);
    } catch (error) {
        console.error('Error fetching cart items:', error);
    }
}

function renderCartItems(cartItems) {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = cartItems.map(item => `
        <div class="cart-item" data-id="${item._id}" data-price="${item.product_id.price}">
            <div class="cart-item-details">
                <input type="checkbox">
                <img src="pictures/${item.product_id.image}" alt="${item.product_id.name}">
                <div>
                    <h3>${item.product_id.name}</h3>
                    <p>$<span class="item-price">${item.product_id.price.toFixed(2)}</span></p>
                </div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-decrease">-</button>
                <input type="text" value="${item.quantity}" class="quantity-input">
                <button class="quantity-increase">+</button>
            </div>
            <div class="cart-item-total">
                <p>$<span class="total-price">${(item.product_id.price * item.quantity).toFixed(2)}</span></p>
                <button class="delete-button">Delete</button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.quantity-decrease').forEach(button => {
        button.addEventListener('click', updateQuantity);
    });

    document.querySelectorAll('.quantity-increase').forEach(button => {
        button.addEventListener('click', updateQuantity);
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', deleteCartItem);
    });
}

async function updateQuantity(event) {
    const cartItem = event.target.closest('.cart-item');
    const itemId = cartItem.dataset.id;
    const price = parseFloat(cartItem.dataset.price);
    const quantityInput = cartItem.querySelector('.quantity-input');
    let quantity = parseInt(quantityInput.value);

    if (event.target.classList.contains('quantity-decrease')) {
        if (quantity > 1) {
            quantity--;
        }
    } else if (event.target.classList.contains('quantity-increase')) {
        quantity++;
    }

    quantityInput.value = quantity;
    const totalPriceElement = cartItem.querySelector('.total-price');
    totalPriceElement.textContent = (price * quantity).toFixed(2);

    updateCartSummary();

    try {
        await fetch(`/api/shopping_cart/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity })
        });
    } catch (error) {
        console.error('Error updating quantity:', error);
    }
}

async function deleteCartItem(event) {
    const cartItem = event.target.closest('.cart-item');
    const itemId = cartItem.dataset.id;

    try {
        const response = await fetch(`/api/shopping_cart/${itemId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            cartItem.remove();
            updateCartSummary();
        } else {
            alert('Failed to remove item from cart');
        }
    } catch (error) {
        console.error('Error deleting cart item:', error);
    }
}

function updateCartSummary() {
    const cartItems = document.querySelectorAll('.cart-item');
    let totalItems = 0;
    let totalPrice = 0;

    cartItems.forEach(item => {
        const quantity = parseInt(item.querySelector('.quantity-input').value);
        const price = parseFloat(item.querySelector('.item-price').textContent);

        totalItems += quantity;
        totalPrice += price * quantity;
    });

    document.querySelector('.cart-summary-total .total-price').textContent = totalPrice.toFixed(2);
    document.querySelector('.cart-summary-total').firstElementChild.textContent = `Total (${totalItems} items): $${totalPrice.toFixed(2)}`;
}

document.addEventListener('DOMContentLoaded', getCartItems);