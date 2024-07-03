const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const { log } = require('console');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3001; // Use environment variable or default to 3001

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/Anything&Anywhere')
.then(()=>{
    console.log('mongodb connected');
})
.catch(()=>{
  console.log('failed to connected');
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket server
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

// Start servr
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Schemas
const { Schema } = mongoose;

const userSchema = new Schema({
  email: String,
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
});

const shopSchema = new Schema({
  name: String,
  image: String,
  category: String,
});

const orderSchema = new Schema({
  user_id: Schema.Types.ObjectId,
  order_date: Date,
  order_time: Date,
  payment_method: String,
  shipping_address: Schema.Types.ObjectId,
  order_status: String,
});

const orderItemSchema = new Schema({
  order_id: Schema.Types.ObjectId,
  product_id: Schema.Types.ObjectId,
  quantity: Number,
  price: Number,
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
  const { email, password } = req.body;
  console.log('Login attempt:', email, password); // Log login attempt

  try {
    const user = await User.findOne({ email });
    if (user) {
      console.log('User found:', user);
      if (password === user.password) { // Compare plaintext passwords for now
        req.session.userId = user._id;
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
  const { email, password } = req.body;
  console.log('Received registration request:', { email, password });
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }
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

// Shopping Cart Checkout, Quantity & Deletion
// Add to cart function
app.post('/api/shopping_cart', isAuthenticated, async (req, res) => {
  const { product_id } = req.body;
  try {
    let cartItem = await Cart.findOne({ user_id: req.session.userId, product_id });
    if (cartItem) {
      cartItem.quantity += 1;
    } else {
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

// Bee Cheng Hiang Store Page Functions
// Render product from products collection
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({ shopId: 1 }); // Example shop ID for Bee Cheng Hiang
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


