const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const app = express();
const PORT = 3000;
const dbn = 'bazaar';
let dbc = "electric gadjets";  // default collection

app.use(express.static(path.join(__dirname,'e20public')));

const uri = 'mongodb://localhost:27017';

let tempProducts = [];         // Newly added products
let tempUpdatedProducts = [];  // Updated products

app.get("/login",(req,res)=>{
    console.log("Visited First Page at "+ new Date());
    res.sendFile((path.join(__dirname,'e20public','e20login.html')));
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/login', async (req, res) => {
  const details = {
    name:req.body.Username.trim(),
    password:req.body.password.trim()
  }
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const user = await client.db(dbn).collection('Admin')
      .findOne(details);

    console.log("Visited at " + new Date());

    if (user) {
  console.log(`Successfully Login ${details.name}`);
  res.status(200).send(`
    <html>
      <head>
        <title>Welcome</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin-top: 50px;
            background: #f5f8ff;
          }
          h1 {
            color: #0a2862;
            margin-bottom: 30px;
          }
          button {
            padding: 12px 20px;
            margin: 10px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s ease;
          }
          button:hover {
            background: #0056b3;
          }
        </style>
      </head>
      <body>
        <h1>Welcome To MAYA BAZAAR, ${details.name}!</h1>
        <p>Select a category to manage:</p>
        <form method="get" action="/selectCollection">
          <button type="submit" name="col" value="electric gadjets">Electronics</button>
          <button type="submit" name="col" value="Groceries">Groceries</button>
        </form>
      </body>
    </html>
  `);
        //   <button type="button" onclick="location.href='/create'">Add Product</button>
        // <button type="button" onclick="location.href='/update'">Update Products</button>
        // <button type="button" onclick="location.href='/delete'">Delete Products</button>
        // <button type="button" onclick="location.href='/list'">View Products</button>
        // <button type="button" onclick="location.href='/e20c.html'">View Created Products</button>
} else {
      res.status(401).send('<h1>Invalid Login ID or Password</h1>');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('<h1>Server Error</h1>');
  } finally {
    await client.close();
  }
});

app.get('/selectCollection', (req, res) => {
  const col = req.query.col;

  if (col === "electric gadjets") {
    dbc = "electric gadjets";   // your MongoDB collection name
  } else if (col === "Groceries") {
    dbc = "Groceries";     // your MongoDB collection name
  }
  console.log("Collection changed to:", dbc);
  res.redirect("/create");   // load products from the chosen collection
});

// Serve create product page
app.get('/create', (req, res) => {
    res.sendFile(path.join(__dirname,'e20public','e20.html'));
});

// API: Add new product
app.post('/api/create', async (req, res) => {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const details = {
            id: parseInt(req.body.id),
            name: req.body.name,
            model: req.body.model,
            price: parseInt(req.body.price),
            image: req.body.image
        };

        await client.db(dbn).collection(dbc).insertOne(details);
        tempProducts.push(details);

        // Redirect with query params
        res.redirect(`/e20c.html?id=${details.id}&name=${encodeURIComponent(details.name)}&model=${encodeURIComponent(details.model)}&price=${details.price}&image=${encodeURIComponent(details.image)}&type=create`);

    } catch (err) {
        console.error("DB ERROR:", err);
        res.status(500).json({ error: err.message });
    } finally {
        await client.close();
    }
});

// API: Get all temp products
app.get("/api/temp-products", (req, res) => {
    res.json(tempProducts);
});

// Serve product list page
app.get('/list', (req, res) => {
    res.sendFile(path.join(__dirname,'e20public','e20l.html'));
});

// API: Get all products from DB
app.get('/api/list', async (req, res) => {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const result = await client.db(dbn).collection(dbc).find({}).toArray();
        res.json(result);
    } catch (err) {
        console.error("DB ERROR:", err);
        res.status(500).json({ error: err.message });
    } finally {
        await client.close();
    }
});

// Serve update product page
app.get('/update', (req, res) => {
    res.sendFile(path.join(__dirname,'e20public','e20u.html'));
});

// API: Update product
app.post('/api/update', async (req, res) => {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const pid = parseInt(req.body.id);
        const details = {
            name: req.body.name,
            model: req.body.model,
            price: parseInt(req.body.price),
            image: req.body.image
        };

        await client.db(dbn).collection(dbc).updateOne({ id: pid }, { $set: details });

        // Push updated product (avoid duplicates)
        const existingIndex = tempUpdatedProducts.findIndex(p => p.id === pid);
        if (existingIndex >= 0) {
            tempUpdatedProducts[existingIndex] = { id: pid, ...details };
        } else {
            tempUpdatedProducts.push({ id: pid, ...details });
        }

        // Redirect with query params
        res.redirect(`/e20c.html?id=${pid}&name=${encodeURIComponent(details.name)}&model=${encodeURIComponent(details.model)}&price=${details.price}&image=${encodeURIComponent(details.image)}&type=update`);
    } catch (err) {
        console.error("DB ERROR:", err);
        res.status(500).json({ error: err.message });
    } finally {
        await client.close();
    }
});

// API: Get all updated products
app.get("/api/temp-updated-products", (req, res) => {
    res.json(tempUpdatedProducts);
});

app.get('/delete', (req, res) => {
    res.sendFile(path.join(__dirname,'e20public','e20d.html'));
});

// API: Delete product
app.post('/api/delete', async (req, res) => {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const pid = parseInt(req.body.id);  // Now works, req.body.id will not be undefined
        const result = await client.db(dbn).collection(dbc).deleteOne({ id: pid });

        if (result.deletedCount > 0) {
            res.json({ message: `Product with ID ${pid} has been deleted successfully!` });
        } else {
            res.json({ message: `No product found with ID ${pid}.` });
        }

    } catch (err) {
        console.error("DB ERROR:", err);
        res.status(500).json({ message: "An error occurred while deleting the product." });
    } finally {
        await client.close();
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).send('<h1>Page Not Found</h1>');
});

app.listen(PORT, () => {
    console.log(`Server Runs On Local Host ${PORT}`);
});
