const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const { log } = require('console');
const http = require('http');
const WebSocket = require('ws');
const rateLimit = require('express-rate-limit');
const multer = require('multer'); // For image upload

const app = express();
const port = process.env.PORT || 3002; // localhost 3002
// The API Key cant be push into GitHub, need key in yourself
const OPENAI_API_KEY = 

// Middleware Setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiter to limit requests from the same IP address
const chatbotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 5, // Limit to 5 requests per minute per IP
  message: 'Too many requests from this IP, please try again later.',
});

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/Anything&Anywhere')
.then(()=>{
    console.log('mongodb connected');
})
.catch(()=>{
  console.log('failed to connected');
});

// Configure Storage for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/pictures/store image/'); // Specify the folder where files will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Create HTTP server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log(`Received: ${message}`);
    // Broadcast the message to all clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Chatbot Route with Exponential Backoff
app.post('/api/chatbot', chatbotLimiter, async (req, res) => {
  const { message } = req.body;

  // Exponential Backoff Function
  async function callOpenAI(message, retries = 3, delay = 1000) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-turbo',  // Correct model identifier
          messages: [{ role: 'user', content: message }],
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      if (error.response && error.response.status === 429 && retries > 0) {
        console.log('Rate limit hit, retrying...');
        await new Promise(resolve => setTimeout(resolve, delay));
        return callOpenAI(message, retries - 1, delay * 2);
      } else {
        console.error('Error communicating with OpenAI:', error);
        throw error;
      }
    }
  }

  try {
    const reply = await callOpenAI(message);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: 'Chatbot failed to respond' });
  }
});

// Set

// Serve HTML Pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user_dashboard.html'));
});

// Start server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Schemas
const { Schema } = mongoose;

const userSchema = new Schema({
  username: String,
  name: String,
  email: String,
  phone: String,
  dob: Date,
  password: String,
}, { 
  collection: 'users',
  versionKey: false // Disable the __v field
});

const addressSchema = new Schema({
  user_id: Schema.Types.ObjectId,
  unit_number: String,
  street_number: String,
  address_line1: String,
  address_line2: String,
  postal_code: String,
  country: String,
}, {
  collection: 'user_address',
});

const productSchema = new Schema({
  name: String,
  description: String,
  price: Number,
  quantity: Number,
  category: String,
  image: String,
  shopId: Number,
}, { 
  collection: 'products',
  versionKey: false
});

const shopSchema = new Schema({
  name: String,
  image: String,
  category: String,
  seller: { type: Schema.Types.ObjectId, ref: 'Seller' },
});

const orderSchema = new Schema({
  user_id: Schema.Types.ObjectId,
  order_date: { type: Date, default: Date.now },
  payment_method: String,
  shipping_address: Schema.Types.ObjectId,
  order_status: String,
  orderItems: [{ type: Schema.Types.ObjectId, ref: 'OrderItem' }]
});

const orderItemSchema = new Schema({
  user_id: Schema.Types.ObjectId,
  order_id: Schema.Types.ObjectId,
  product_id: Schema.Types.ObjectId,
  quantity: Number,
  price: Number,
}, {
  collection: 'orderitems',
});

const reviewSchema = new Schema({
  user_id: Schema.Types.ObjectId,
  order_id: Schema.Types.ObjectId,
  ratings: Number,
  comment: String,
});

const paymentMethodSchema = new Schema({
  user_id: Schema.Types.ObjectId,
  payment_type_id: Number,
  provider: String,
  card_number: String,
  expiry_date: Date,
});

const cartSchema = new Schema({
  user_id: Schema.Types.ObjectId,
  product_id: { type: Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, default: 1 },
});

const sellerSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, 
  shopId: { type: Number, required: true },
}, { collection: 'sellers' });


// Define models with custom collection names
const User = mongoose.model('User', userSchema);
const Address = mongoose.model('Address', addressSchema);
const Product = mongoose.model('Product', productSchema);
const Shop = mongoose.model('Shop', shopSchema);
const Order = mongoose.model('Order', orderSchema);
const OrderItem = mongoose.model('OrderItem', orderItemSchema);
const Review = mongoose.model('Review', reviewSchema);
const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
const Cart = mongoose.model('Cart', cartSchema);
const Seller = mongoose.model('Seller', sellerSchema);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// User account management
// Session management
app.use(session({
  secret: 'yourSecretKey', // Change this to a secure, random string
  resave: false,
  saveUninitialized: true,
}));
// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    res.status(401).send('You need to log in first');
  }
}
// User login method
app.post('/login', async (req, res) => {
  // Destructure email and password from formData
  const { email, password } = req.body;
  console.log('Login attempt:', email, password);

  try {
    // Find the user in the database using user's email
    const user = await User.findOne({ email });
    // Check user exist
    if (user) {
      console.log('User found:', user);
      // Compare formData password vs database password
      // Using plaintext password comparison, plan to use hashaed password in the future
      if (password === user.password) { 
        req.session.userId = user._id;
        req.session.save;
        console.log('Login successful');
        res.status(200).json({ message: 'User logged in' });
      } else {
        console.log('Invalid password');
        res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      console.log('User not found');
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});
// Account Creation or Registration
app.post('/register', async (req, res) => {
  // Destructure email and password from formData object
  const { email, password } = req.body;
  console.log('Received registration request:', { email, password });
  try {
    // Check if user exist with the provided mail 
    // Compare using formData object email vs database email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }
    // Create a new user with the formData object
    const user = new User({ email, password });
    await user.save();
    console.log('User registered successfully:', email);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
});
// Endpoint to get session info
app.get('/api/session', (req, res) => {
  console.log('Session User ID:', req.session.userId); // Debugging statement
  if (req.session.userId) {
    res.json({ userId: req.session.userId });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// Seller account management
// Middleware to check if seller is authenticated
function isSellerAuthenticated(req, res, next) {
  if (req.session && req.session.sellerId) {
    // If the seller is logged in, proceed to the next middleware or route
    return next();
  } else {
    // If not authenticated, return a 401 status with an error message
    return res.status(401).json({ message: 'Error: Seller not logged in' });
  }
}
// Seller Login
app.post('/api/sellers/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the seller by email
    const seller = await Seller.findOne({ email }).populate('shopId');
    if (!seller) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if the password matches
    if (seller.password !== password) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    console.log(`Seller ${seller.username} logged in successfully.`);

    // Save session
    req.session.sellerId = seller._id;
    req.session.shopId = seller.shopId;

    console.log('Session Data:', req.session);

    // Send success response with seller info
    res.status(200).json({ 
      message: 'Seller logged in successfully',
      username: seller.username,
      shopId: seller.shopId
    });
  } catch (error) {
    console.error('Error logging in seller:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});
// Allow seller to fulfill orders
app.get('/api/orders', async (req, res) => {
  try {
      const orders = await Order.find()
          .populate('user_id', 'name') // Assuming you want to display the user's name
          .populate('shipping_address') // Populate shipping address if needed
          .populate({
              path: 'orderItems.product_id', // Populate product details in orderItems
              select: 'name image price', // Select only the fields needed for display
          });
      res.json(orders);
  } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
  }
});
// Allow seller to manage products linked to their shop
app.put('/api/products/:productId', upload.single('image'), async (req, res) => {
  const { productId } = req.params;
  const { name, description, price, quantity, category } = req.body;
  const image = req.file ? req.file.path : null;

  try {
      // Update the product in the database
      const updatedProduct = await Product.findByIdAndUpdate(
          productId,
          { name, description, price, quantity, category, ...(image && { image }) },
          { new: true }
      );

      if (!updatedProduct) {
          return res.status(404).json({ message: 'Product not found' });
      }

      res.json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});
// Allow Seller to add new products
app.post('/api/seller/products', isSellerAuthenticated, upload.single('image'), async (req, res) => {
  const { name, description, price, quantity, category } = req.body;
  const imagePath = req.file ? req.file.path : null; // Store the image file path

  if (!req.session.shopId) {
    return res.status(400).json({ message: 'Wrong'})
  }

  try {
    const newProduct = new Product({
      name,
      description,
      price,
      quantity,
      category,
      image: imagePath, // Save the image path in MongoDB
      shopId: req.session.shopId, // Use shopId from current session
    });

    await newProduct.save();
    res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Error adding product', error: error.message });
  }
});

// Shopping Cart Checkout, Quantity & Deletion
// Add to cart function
app.post('/api/shopping_cart', isAuthenticated, async (req, res) => {
  // Destructure product_id from request
  const { product_id } = req.body;
  try {
    // Find a cart item in the database matching the user ID from the session and the product ID from the request body 
    let cartItem = await Cart.findOne({ user_id: req.session.userId, product_id });
    if (cartItem) {
      // If cart item exist, increate the qty by 1
      cartItem.quantity += 1;
    } else {
      // If cart tem does not exist, create new cart and insert item
      cartItem = new Cart({ user_id: req.session.userId, product_id });
    }
    await cartItem.save();
    res.status(201).json(cartItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Delete item from the cart
app.delete('/api/shopping_cart/:id', isAuthenticated, async (req, res) => {
  try {
    await Cart.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Update quantity of item in the cart
app.put('/api/shopping_cart/:id', isAuthenticated, async (req, res) => {
  const { quantity } = req.body;
  try {
    const cartItem = await Cart.findById(req.params.id);
    if (cartItem) {
      cartItem.quantity = quantity;
      await cartItem.save();
      res.status(200).json(cartItem);
    } else {
      res.status(404).json({ message: 'Item not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Render shopping cart products from shopping_cart
app.get('/api/shopping_cart', isAuthenticated, async (req, res) => {
  try {
    const cartItems = await Cart.find({ user_id: req.session.userId }).populate('product_id');
    res.json(cartItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Checkout Page
// Fetch user address, rendering
app.get('/api/user_address', isAuthenticated, async (req, res) => {
  try {
    const address = await Address.findOne({ user_id: req.session.userId });
    if (address) {
      res.json(address);
    } else {
      res.status(404).json({ message: 'Address not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user address', error: err.message });
  }
});
// Place order
app.post('/api/orders', isAuthenticated, async (req, res) => {
  try {
    const { payment_method, shipping_address_id, orderItems } = req.body;

    const cartItems = await Cart.find({ user_id: req.session.userId }).populate('product_id');
    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Fetch the existing address using the provided shipping_address_id
    const address = await Address.findOne({ _id: shipping_address_id, user_id: req.session.userId });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const order = new Order({
      user_id: req.session.userId,
      order_date: new Date(),
      payment_method,
      shipping_address: address._id,
      order_status: 'Pending'
    });

    await order.save();

    const orderItemsData = cartItems.map(item => ({
      user_id: req.session.userId,
      order_id: order._id,
      product_id: item.product_id._id,
      quantity: item.quantity,
      price: item.product_id.price,
    }));

    const createdOrderItems = await OrderItem.insertMany(orderItemsData);
    order.orderItems = createdOrderItems.map(item => item._id);
    await order.save();

    // Clear the cart
    await Cart.deleteMany({ user_id: req.session.userId });

    res.status(201).json({ message: 'Order placed successfully', orderId: order._id });
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ message: 'Error placing order', error: err.message });
  }
});

// User Dashboard
// Pending Order Page
// Fetch orders, rendering
app.get('/api/orders', isAuthenticated, async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.session.userId })
      .populate('shipping_address')
      .populate({
        path: 'orderItems',
        populate: {
          path: 'product_id',
          model: 'Product'
        }
      });

    console.log('Fetched orders:', orders);

    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Error fetching orders', error: err.message });
  }
});

// Address Dashboard Page
// User Address Current Session
app.put('/api/user_address', isAuthenticated, async (req, res) => {
  try {
    const { unit_number, street_number, address_line1, address_line2, postal_code, country } = req.body;

    const updatedAddress = await Address.findOneAndUpdate(
      { user_id: req.session.userId },
      { unit_number, street_number, address_line1, address_line2, postal_code, country },
      { new: true, upsert: true } // Create the address if it doesn't exist
    );

    res.json(updatedAddress);
  } catch (err) {
    res.status(500).json({ message: 'Error updating address', error: err.message });
  }
});

// User_dashboard Page
// Get user info
app.get('/api/user_info', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user info', error: err.message });
  }
});

// Update User info
app.put('/api/user_info', isAuthenticated, async (req, res) => {
  try {
    const { username, name, email, phone, dob } = req.body;
    let user = await User.findById(req.session.userId);

    if (user) {
      // Update existing user info
      user.username = username || user.username;
      user.name = name || user.name;
      user.email = email || user.email;
      user.phone = phone || user.phone;
      user.dob = dob || user.dob;
    } else {
      // Create new user info
      user = new User({
        _id: req.session.userId,
        username,
        name,
        email,
        phone,
        dob,
        password: '' // This is just a placeholder
      });
    }

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error updating user info', error: err.message });
  }
});


// Bee Cheng Hiang Store Page Functions
// Render product from products collection
app.get('/api/products', async (req, res) => {
  try {
    // Getch products from shopId 1
    const products = await Product.find({ shopId: 1 }); // Example shop ID for Bee Cheng Hiang
    console.log(products);
    res.json(products);
  } catch (err) {
    res.status(500).send(err);
  }
});


// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'beeChengHiang.html'));
});
app.get('/dashboard.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user_dashboard.html'));
});


