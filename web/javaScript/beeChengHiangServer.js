/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/JavaScript.js to edit this template
 */

const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const port = 3000;

// MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'yourusername',
  password: 'yourpassword',
  database: 'yourdatabase'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

// Serve static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to fetch products
app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM product WHERE shop_id = ?';
  const shopId = 1; // Example shop ID for Bee Cheng Hiang

  db.query(query, [shopId], (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'beeChengHiangPage.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

