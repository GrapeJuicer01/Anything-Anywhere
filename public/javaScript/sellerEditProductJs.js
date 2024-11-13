// Fetch products and display them
document.addEventListener('DOMContentLoaded', function () {
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            const productGrid = document.getElementById('product-grid');
            productGrid.innerHTML = data.map(product => `
                <div class="product-item">
                    <img src="pictures/${product.image}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <p>$${product.price.toFixed(2)}</p>
                    <p>Quantity: ${product.quantity}</p>
                    <button onclick="openEditForm('${product._id}', '${product.name}', '${product.description}', '${product.price}', '${product.quantity}', '${product.category}', '${product.image}')">Edit</button>
                </div>
            `).join('');
        })
        .catch(error => console.error('Error fetching products:', error));
});

// Open the form and populate with product data
function openEditForm(id, name, description, price, quantity, category, image) {
    document.getElementById('edit-product-id').value = id;
    document.getElementById('product-name').value = name;
    document.getElementById('product-description').value = description;
    document.getElementById('product-price').value = parseFloat(price);
    document.getElementById('product-quantity').value = quantity;
    document.getElementById('product-category').value = category;
    document.getElementById('edit-product').style.display = 'flex';
}

// Close the form
function closeForm() {
    document.getElementById('edit-product').style.display = 'none';
}

// Handle the form submission for updating the product
document.getElementById('edit-product-form').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent default form submission

    const productId = document.getElementById('edit-product-id').value;
    const formData = new FormData();
    formData.append('name', document.getElementById('product-name').value);
    formData.append('description', document.getElementById('product-description').value);
    formData.append('price', document.getElementById('product-price').value);
    formData.append('quantity', document.getElementById('product-quantity').value);
    formData.append('category', document.getElementById('product-category').value);

    const imageFile = document.getElementById('product-image').files[0];
    if (imageFile) {
        formData.append('image', imageFile); // Include image if selected
    }

    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            body: formData
        });

        if (response.ok) {
            alert('Product updated successfully!');
            closeForm();
            location.reload(); 
        } else {
            const result = await response.json();
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        console.error('Error updating product:', error);
        alert('An error occurred while updating the product.');
    }
});

