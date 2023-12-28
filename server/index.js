const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import cors module
const bcrypt = require("bcrypt");
const saltRounds = 10;
const multer = require("multer");
const path = require("path");
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// Setup storage for multer

const uploadDir = 'C:/Users/joneb/mydishbend/uploads'; // Replace with your actual directory path

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Use the uploadDir variable for the destination folder
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

// MySQL database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Pa$$w0rd",
  database: "mydishdb",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL");
});

// Middleware for parsing JSON in requests
app.use(bodyParser.json());

// Use cors middleware with specified options
app.use(cors({}));

// Registration endpoint
app.post("/api/register", async (req, res) => {
  const { firstName, lastName, email, password, rePassword, phoneNumber } =
    req.body;

  // Insert user into the database with all details
  db.query(
    "INSERT INTO app_users (first_name, last_name, password, email, phonenumber) VALUES (?, ?, ?, ?, ?)",
    [firstName, lastName, password, email, phoneNumber],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      res.json({ message: "User registered successfully" });
    }
  );
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  try {
    // Retrieve user from the database based on the provided email
    db.query(
      "SELECT * FROM app_users WHERE email = ? AND password = ?",
      [email, password],
      (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        // Check if the user exists and the password matches
        if (results.length === 0) {
          return res.status(401).json({ error: "Invalid email or password" });
        }

        // You can include additional information in the response if needed
        res.json({ message: "Login successful", user: results[0] });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update user profile endpoint
// Update user profile endpoint
app.post("/api/update-profile", async (req, res) => {
  const { userId, newName, newLastName, newEmail, newNumber } = req.body;

  console.log("Incoming data:", req.body); // Add this line

  // Update user information in the database
  db.query(
    "UPDATE app_users SET first_name = ?, last_name = ?, email = ?, phonenumber = ? WHERE userid = ?",
    [newName, newLastName, newEmail, newNumber, userId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "User profile updated successfully" });
    }
  );
});

// API endpoint for product list
app.get("/api/products", (req, res) => {
  const query = "SELECT * FROM products";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    res.json({ products: results }); // Wrap the results in an object for consistency
  });
});

// API endpoint for product details
app.get("/api/products/:id", (req, res) => {
  const productId = req.params.id;
  const query = "SELECT * FROM products WHERE id = ?";

  db.query(query, [productId], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ product: results[0] }); // Wrap the result in an object for consistency
  });
});
// Function to generate a random order number
const generateRandomOrderNumber = () => {
  return Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit random number
};

app.post("/api/products", upload.single("product_image"), (req, res) => {
  const {
    product_name,
    product_description,
    product_price,
    short_description,
    discount_price,
    product_ingredients,
  } = req.body;

  const product_image = req.file ? req.file.filename : null; // Get the filename of the uploaded image

  // Validate input data (add more validation as needed)
  if (!product_name || !product_price) {
    return res
      .status(400)
      .json({ error: "Product name and price are required." });
  }

  // Insert the new product into the database
  const query =
    "INSERT INTO products (product_name, product_description, product_price, short_description, discount_price, product_image, product_ingredients) VALUES (?, ?, ?, ?, ?, ?, ?)";

  db.query(
    query,
    [
      product_name,
      product_description,
      product_price,
      short_description,
      discount_price,
      product_image,
      product_ingredients,
    ],
    (err, results) => {
      if (err) {
        console.error("Error executing query:", err);
        return res
          .status(500)
          .json({ error: "Internal Server Error", details: err.message });
      }

      // Fetch the newly added product
      const fetchQuery = "SELECT * FROM products WHERE id = ?";

      db.query(fetchQuery, [results.insertId], (fetchErr, fetchResults) => {
        if (fetchErr) {
          console.error("Error fetching newly added product:", fetchErr);
          return res
            .status(500)
            .json({
              error: "Internal Server Error",
              details: fetchErr.message,
            });
        }

        res.json({ product: fetchResults[0] }); // Wrap the result in an object for consistency
      });
    }
  );
});

// API endpoint for saving payment details
// Update the existing payment detail API endpoint
app.post("/api/paymentdetail", async (req, res) => {
  const {
    firstName,
    lastName,
    address,
    postalCode,
    email,
    mobile,
    paymentMethod,
    price,
    cardName,
    cardNumber,
    expireDate,
    cvv,
  } = req.body;

  const orderNumber = generateRandomOrderNumber(); // Generate a random order number

  // Insert payment details into the database
  db.query(
    "INSERT INTO payment_detail (order_number, payment_firstname, payment_lastname, payment_address, payment_postalcode, payment_email, payment_phonenumber, payment_cardname, payment_cardnumber, payment_expiredate, payment_cvv) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      orderNumber, // Use the dynamically generated order number
      firstName,
      lastName,
      address,
      postalCode,
      email,
      mobile,
      cardName,
      cardNumber,
      expireDate,
      cvv,
    ],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      res.json({
        message: "Payment details saved successfully",
        paymentId: results.insertId,
        orderNumber,
      });
    }
  );
});
// API endpoint for fetching order details by order number
app.get("/api/orderdetails/:orderNumber", async (req, res) => {
  const orderNumber = req.params.orderNumber;

  // Query the database to retrieve order details using the order number
  db.query(
    "SELECT * FROM payment_detail WHERE order_number = ?",
    [orderNumber],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }

      const orderDetails = results[0];
      res.json(orderDetails);
    }
  );
});
app.get("/api/companydetails", (req, res) => {
  const query = "SELECT * FROM company_info";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    res.json({ companyInfo: results[0] }); // Assuming you expect one result
  });
});

app.post("/api/loginadmin", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Retrieve user from the database based on the provided email
    db.query(
      "SELECT * FROM admin_user WHERE email = ?",
      [email],
      async (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        // Check if the user exists
        if (results.length === 0) {
          return res.status(401).json({ error: "Invalid email or password" });
        }

        // Compare the hashed password
        const hashedPassword = results[0].password;
        if (password === hashedPassword) {
          // Passwords match, login successful
          res.json({ message: "Login successful", user: results[0] });
        } else {
          // Passwords do not match
          res.status(401).json({ error: "Invalid email or password" });
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all users endpoint
app.get("/api/users", (req, res) => {
  // Retrieve all users from the app_users table
  db.query("SELECT * FROM app_users", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    res.json({ users: results });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
