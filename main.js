const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const { log } = require('console');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer'); // For image upload

const app = express();
const port = process.env.PORT || 3002; // localhost 3002
// The API Key cant be push into GitHub, need key in yourself
const OPENAI_API_KEY = "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";
const ASSISTANT_ID = "asst_TRBnzVpjrJeudFoJWr5zgbwj";

// General Middleware Setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection setup
mongoose.connect('mongodb://localhost:27017/Anything&Anywhere')
.then(()=>{
    console.log('mongodb connected');
})
.catch(()=>{
  console.log('failed to connected');
});

// ====== Configure Storage For Multer And Specify The File Path. ======
// This Is Part Of Seller Uploading Of Item
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/pictures/store image/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Create HTTP Server And WebSocket Server, Multiple Clients Communications
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
// a listener for new WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');
// a listener for Client's Message
  ws.on('message', (message) => {
    console.log(`Received: ${message}`);
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
// a lister for Client's disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// ====== API for using OpenAI's GPT-4-turbo features ======
app.post('/api/chatbot', async (req, res) => {
  const { message } = req.body;

  async function callOpenAI(message, retries = 3, delay = 1000) {
    try {
      // POST response to OpenAPI endpoint using fetch
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4-turbo',
            messages: [
              { "role": "system", 
                "content": "You are a knowledgeable eCommerce assistant based in Singapore. Answer all common e-commerce questions in a polite way." 
              },
              { "role": "user", 
                "content": message 
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        // retries 3 times if rate limit error, can be configured
        if (response.status === 429 && retries > 0) {
          console.log('Rate limit hit, retrying...');
          await new Promise(resolve => setTimeout(resolve, delay));
          return callOpenAI(message, retries - 1, delay * 2);
        }
        throw new Error(`Failed with status code ${response.status}`);
      }
      // parse the JSON respones and return message from GPT
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error communicating with OpenAI:', error);
      throw error;
    }
  }

  // send the GPT response back to client
  try {
    const reply = await callOpenAI(message);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: 'Chatbot failed to respond' });
  }
});

// Serve HTML Pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Serve This File After Logged In.
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user_dashboard.html'));
});

// Start Server, 3002 As Configured
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// ====== SCHEMAS ======
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
  user_id: { type: Schema.Types.ObjectId, ref: 'User' },
  order_date: { type: Date, default: Date.now },
  payment_method: String,
  shipping_address: { type: Schema.Types.ObjectId, ref: 'Address' }, // Ensure this matches the model name for `user_address`
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

// ====== MONGOOSE MODEL ======
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

// ====== USER ACCOUNT MANAGEMENT ======
// Session Management
app.use(session({
  secret: 'yourSecretKey', // assign random string 
  resave: false, 
  saveUninitialized: true,
}));

// Middleware function, To Verify userId To Session userId
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    res.status(401).send('You need to log in first');
  }
}

// User Login Method
app.post('/login', async (req, res) => {
  // take email and password from formData
  const { email, password } = req.body;
  console.log('Login attempt:', email, password);

  try {
    // find the user in the database using user's email
    const user = await User.findOne({ email });
    if (user) {
      console.log('User found:', user);
      // compare formData password vs database password
      // using plaintext password comparison, plan to use hashed password in the future
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
  // take email and password from formData object
  const { email, password } = req.body;
  console.log('Received registration request:', { email, password });
  try {
    // check if user exist with the provided mail 
    // compare using formData object email vs database email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }
    // create a new user with the formData object, (email, password)
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
  console.log('Session User ID:', req.session.userId);
  if (req.session.userId) {
    res.json({ userId: req.session.userId });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// ====== SELLER ACCOUNT MANAGEMENT ======
// Middleware Function, To Verify sellerId
function isSellerAuthenticated(req, res, next) {
  if (req.session && req.session.sellerId) {
    return next();
  } else {
    return res.status(401).json({ message: 'Error: Seller not logged in' });
  }
}

// Seller Login Method
app.post('/api/sellers/login', async (req, res) => {
  // take email and password from formData
  const { email, password } = req.body;

  try {
    // find the seller in the database using seller's email
    const seller = await Seller.findOne({ email }).populate('shopId');
    if (!seller) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    // compare formData password vs database password
    // using plaintext password comparison, plan to use hashed password in the future
    if (seller.password !== password) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    console.log(`Seller ${seller.username} logged in successfully.`);
    req.session.sellerId = seller._id;
    req.session.shopId = seller.shopId;
    console.log('Session Data:', req.session);

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
// ====== SELLER ORDER MANAGEMENT ======
// Seller View Orders
app.get('/api/seller/orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('shipping_address')
      .populate('user_id', 'name')
      .populate({
        path: 'orderItems.product_id',
        select: 'name image price',
      });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// ====== SELLER PRODUCT MANAGEMENT ======
// Seller Product Update
app.put('/api/products/:productId', upload.single('image'), async (req, res) => {
  // creates a productId
  const { productId } = req.params;
  // take data from the form
  const { name, description, price, quantity, category } = req.body;
  // file path is according to multer configuration
  const image = req.file ? req.file.path : null;

  try {
      // update data in the database by the productId
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

// Seller Addition Of Products
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

// ====== SHOPPING CART FUNCTIONS ======
// Add Products To Cart Endpoint
app.post('/api/shopping_cart', isAuthenticated, async (req, res) => {
  const { product_id } = req.body;
  try {
    // searches for an existing cart that matches the user_id, it is to restore previous session 
    let cartItem = await Cart.findOne({ user_id: req.session.userId, product_id });
    if (cartItem) {
      // if cart item exist, increase the qty by 1
      cartItem.quantity += 1;
    } else {
      // if cart tem does not exist, create new cart and insert item
      cartItem = new Cart({ user_id: req.session.userId, product_id });
    }
    await cartItem.save();
    res.status(201).json(cartItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Item From The Cart Endpoint
app.delete('/api/shopping_cart/:id', isAuthenticated, async (req, res) => {
  try {
    await Cart.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Quantity Of Item In The Cart Endpoint
app.put('/api/shopping_cart/:id', isAuthenticated, async (req, res) => {
  const { quantity } = req.body;
  try {
    // searches for an existing cart that matches the user_id, it is to restore previous session
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

// Render Shopping Cart Products From shopping_cart Endpoint
app.get('/api/shopping_cart', isAuthenticated, async (req, res) => {
  try {
    const cartItems = await Cart.find({ user_id: req.session.userId }).populate('product_id');
    res.json(cartItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====== CHECKOUT PAGE ======
// Fetch Uer Address, Rendering
app.get('/api/user_address', isAuthenticated, async (req, res) => {
  try {
    // search the address to the current session userId
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

// Place Order
app.post('/api/orders', isAuthenticated, async (req, res) => {
  try {
    const { payment_method, shipping_address_id, orderItems } = req.body;

    const cartItems = await Cart.find({ user_id: req.session.userId }).populate('product_id');
    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const address = await Address.findOne({ _id: shipping_address_id, user_id: req.session.userId });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // create a new order object and set its fields, then save into the database
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
    
    // bulk inject the new order object into "OrderItem" collection in MongoDb
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

// ====== USER DASHBOARD ======
// Pending Order Page 
// Rendering of orderitems
app.get('/api/orders', isAuthenticated, async (req, res) => {
  try {
    // fetch orders that is associated to the current session userId, and populate the fields
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
      { 
        user_id: req.session.userId 
      },
      { 
        unit_number, 
        street_number, 
        address_line1, 
        address_line2, 
        postal_code, 
        country 
      },
    );

    res.json(updatedAddress);
  } catch (err) {
    res.status(500).json({ message: 'Error updating address', error: err.message });
  }
});

// User Dashboard Page
// Get User Info
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
      user.username = username || user.username;
      user.name = name || user.name;
      user.email = email || user.email;
      user.phone = phone || user.phone;
      user.dob = dob || user.dob;
    } else {
      user = new User({
        _id: req.session.userId,
        username,
        name,
        email,
        phone,
        dob,
        password: '' // this is just a placeholder
      });
    }

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error updating user info', error: err.message });
  }
});

// ====== BEE CHENG HIANG STORE ======
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


