const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const app = express();
const router = express.Router();
const PORT = 3000;
const dbn = 'bazaar';
let dbc = "electric gadjets";
let currentRole = null;

// Middleware to serve static files from the 'e22public' directory.
app.use(express.static(path.join(__dirname,'e22public')));
// Middleware to parse URL-encoded bodies (as sent by HTML forms).
app.use(express.urlencoded({ extended: true }));
// Middleware to parse JSON bodies (as sent by API clients).
app.use(express.json());
// MongoDB connection URI.
const uri = 'mongodb://localhost:27017';

// In-memory array to temporarily store newly added products during a session.
let tempProducts = [];
// In-memory array to temporarily store updated products during a session.
let tempUpdatedProducts = [];

// Serves the main login page.
app.get("/login",(req,res)=>{
    console.log("Visited First Page at "+ new Date());
    res.sendFile((path.join(__dirname,'e22public','e22login.html')));
});

// Handles user login authentication.
app.post('/login', async (req, res) => {
    const username = (req.body.username || req.body.Username || "").trim();
    const password = (req.body.password || "").trim();
    const role = req.body.role;

    if (!username || !password || !role) {
        return res.status(400).send("<h1>Missing login details</h1>");
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const collection = role === "Admin" ? "Admin" : "Customer";

        const user = await client.db(dbn).collection(collection).findOne({
            name: username,
            password: password
        });

        if (user) {
            console.log(`${role} Login Successful: ${username}`);
            currentUsername = username;
            currentRole = role;

            // Both Admin and Customer will see the same styled welcome page
            // before being redirected based on their selection.
            res.send(`
              <html>
                <head>
                  <title>Welcome to Maya Bazar</title>
                  <style>
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }

                    body {
                        font-family: 'Poppins', sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        background-image: url("https://i.postimg.cc/RFqSM2rc/bg.jpg");
                        background-size: cover;
                        background-position: center;
                    }

                    .welcome-container {
                        text-align: center;
                        background: rgba(255, 255, 255, 0.95);
                        padding: 40px 50px;
                        border-radius: 15px;
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                        max-width: 500px;
                    }

                    h1 {
                        font-size: 2.5em;
                        font-weight: 700;
                        color: #0a2862;
                        margin-bottom: 10px;
                    }

                    p {
                        font-size: 1.1em;
                        color: #555;
                        margin-bottom: 30px;
                    }

                    .category-buttons {
                        display: flex;
                        gap: 20px;
                        justify-content: center;
                    }

                    .category-btn {
                        padding: 15px 30px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: transform 0.2s ease, background-color 0.2s ease;
                        box-shadow: 0 4px 15px rgba(0, 123, 255, 0.2);
                    }

                    .category-btn:hover {
                        background: #0056b3;
                        transform: translateY(-3px);
                    }
                  </style>
                </head>
                <body>
                  <div class="welcome-container">
                    <h1>Welcome, ${username}!</h1>
                    <p>Select a category to continue.</p>
                    <form method="get" action="/selectCollection">
                      <div class="category-buttons">
                        <button class="category-btn" type="submit" name="col" value="electric gadjets">Electronics</button>
                        <button class="category-btn" type="submit" name="col" value="Groceries">Groceries</button>
                      </div>
                    </form>
                  </div>
                </body>
              </html>
            `);

        } else {
            res.status(401).send(`
                <script>
                  alert("Invalid Username or Password. Please try again.");
                  window.location.href = "/login";
                </script>
            `);
        }
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).send('<h1>Server Error</h1>');
    } finally {
        await client.close();
    }
});


// Serves the page for new customer registration.
app.get("/new", (req, res) => {
    console.log("Visited New Customer Registration at " + new Date());
    res.sendFile((path.join(__dirname, 'e22public', 'e22newlogin.html')));
});

// Handles the submission of the new customer registration form.
app.post('/new', async (req, res) => {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const details = {
            name: req.body.name.trim(),
            email: req.body.email.trim(),
            password: req.body.password.trim()
        };

        const result = await client.db(dbn).collection("Customer").insertOne(details);
        if (result) {
            res.send(`
                <script>
                  alert("Customer ${details.name} has been successfully registered!");
                  window.location.href = "/login";
                </script>
            `);
        }
    } catch (err) {
        console.error("DB ERROR:", err);
        res.send(`
            <script>
              alert("Error creating account. Please try again.");
              window.location.href = "/new";
            </script>
        `);
    } finally {
        await client.close();
    }
});

// Sets the active database collection and redirects the user based on their role.
app.get('/selectCollection', (req, res) => {
    const col = req.query.col;

    if (col === "electric gadjets") {
        dbc = "electric gadjets";
    } else if (col === "Groceries") {
        dbc = "Groceries";
    }
    console.log("Collection changed to:", dbc);

    if (currentRole === "Admin") {
        res.redirect("/create");
    } else {
        res.redirect("/list");
    }
});

// Serves the 'create product' page, accessible only to Admins.
app.get('/create', (req, res) => {
    if (currentRole !== "Admin") return res.status(403).send("<h1>Access Denied</h1>");
    res.sendFile(path.join(__dirname,'e22public','e22.html'));
});

// API endpoint to handle the creation of a new product and add it to the database.
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

        res.redirect(`/e22c.html?id=${details.id}&name=${encodeURIComponent(details.name)}&model=${encodeURIComponent(details.model)}&price=${details.price}&image=${encodeURIComponent(details.image)}&type=create`);

    } catch (err) {
        console.error("DB ERROR:", err);
        res.status(500).json({ error: err.message });
    } finally {
        await client.close();
    }
});

// API endpoint to retrieve the list of temporarily stored new products.
app.get("/api/temp-products", (req, res) => {
    res.json(tempProducts);
});

// Serves the product listing page.
app.get('/list', (req, res) => {
    res.sendFile(path.join(__dirname,'e22public','e22l.html'));
});

// API endpoint to fetch all products from the current database collection.
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

// Serves the 'update product' page, accessible only to Admins.
app.get('/update', (req, res) => {
    if (currentRole !== "Admin") return res.status(403).send("<h1>Access Denied</h1>");
    res.sendFile(path.join(__dirname,'e22public','e22u.html'));
});

// API endpoint to handle updating an existing product in the database.
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

        const existingIndex = tempUpdatedProducts.findIndex(p => p.id === pid);
        if (existingIndex >= 0) {
            tempUpdatedProducts[existingIndex] = { id: pid, ...details };
        } else {
            tempUpdatedProducts.push({ id: pid, ...details });
        }

        res.redirect(`/e22c.html?id=${pid}&name=${encodeURIComponent(details.name)}&model=${encodeURIComponent(details.model)}&price=${details.price}&image=${encodeURIComponent(details.image)}&type=update`);
    } catch (err) {
        console.error("DB ERROR:", err);
        res.status(500).json({ error: err.message });
    } finally {
        await client.close();
    }
});

// API endpoint to retrieve the list of temporarily stored updated products.
app.get("/api/temp-updated-products", (req, res) => {
    res.json(tempUpdatedProducts);
});

// Serves the 'delete product' page, accessible only to Admins.
app.get('/delete', (req, res) => {
    if (currentRole !== "Admin") return res.status(403).send("<h1>Access Denied</h1>");
    res.sendFile(path.join(__dirname,'e22public','e22d.html'));
});

// API endpoint to handle deleting a product from the database.
app.post('/api/delete', async (req, res) => {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const pid = parseInt(req.body.id);
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

// Serves the billing page.
app.get('/e22bill.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'e22public', 'e22bill.html'));
});

// Global variable to store the username for the current session.
let currentUsername = "";
// Global array to temporarily store products for the current bill.
let currentBillProducts = [];

// API endpoint to prepare the bill by storing selected products on the server.
app.post('/prepare-bill', (req, res) => {
    if (!req.body.products || req.body.products.length === 0) {
        return res.status(400).send({ error: "No products selected" });
    }
    currentBillProducts = req.body.products;
    res.send({ success: true });
});

// API endpoint to finalize and save the bill to the database.
app.post('/bill', async (req, res) => {
    const billData = {
        user: currentUsername || "Anonymous Customer",
        products: currentBillProducts,
        subtotal: 0,
        gstPercent: 2,
        gstAmount: 0,
        totalAmount: 0,
        paymentMethod: req.body.paymentMethod,
        date: new Date().toLocaleString()
    };

    billData.products.forEach(p => billData.subtotal += Number(p.price));

    billData.gstAmount = Math.round((billData.subtotal * billData.gstPercent / 100) * 100) / 100;
    billData.totalAmount = Math.round((billData.subtotal + billData.gstAmount) * 100) / 100;
    billData.subtotal = Math.round(billData.subtotal * 100) / 100;

    try {
        const client = new MongoClient(uri);
        await client.connect();
        await client.db(dbn).collection('bills').insertOne(billData);
        await client.close();
        res.status(200).send({ success: true });
    } catch (err) {
        console.error("Error saving bill:", err);
        res.status(500).send({ success: false, error: err.message });
    }
});

// API endpoint to retrieve the current bill's products for display on the billing page.
app.get('/get-bill', (req, res) => {
    if (!currentBillProducts || currentBillProducts.length === 0) {
        return res.status(400).send({ error: "No products selected" });
    }

    const billPreview = {
        user: currentUsername || "Anonymous Customer",
        products: currentBillProducts
    };

    res.json(billPreview);
});

// Fallback route to handle 404 Not Found errors.
app.use((req, res) => {
    res.status(404).send('<h1>Page Not Found</h1>');
});

// Starts the Express server and listens on the specified PORT.
app.listen(PORT, () => {
    console.log(`Server Runs On Local Host ${PORT}`);
});