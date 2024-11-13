// Function to add new products using the form
document.addEventListener('DOMContentLoaded', () => {
    const addProductForm = document.getElementById('add-product-form');

    addProductForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const formData = new FormData();
        formData.append('name', document.getElementById('product-name').value);
        formData.append('description', document.getElementById('product-description').value);
        formData.append('price', document.getElementById('product-price').value);
        formData.append('quantity', document.getElementById('product-quantity').value);
        formData.append('category', document.getElementById('product-category').value);
        formData.append('image', document.getElementById('product-image').files[0]);

        try {
            const response = await fetch('/api/seller/products', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                alert('Product added successfully!');
                addProductForm.reset();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error adding product:', error);
            alert('An error occurred while adding the product. Please try again.');
        }
    });
});
