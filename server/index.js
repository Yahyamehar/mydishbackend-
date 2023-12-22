const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import cors module
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();
const port = process.env.PORT || 5000;

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

// API endpoint to retrieve all products
// API endpoint to retrieve all products
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
