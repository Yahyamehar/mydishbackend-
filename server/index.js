const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import cors module
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
const port = process.env.PORT || 5000;

// MySQL database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Pa$$w0rd',  
    database: 'mydishdb',  
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL');
});

// Middleware for parsing JSON in requests
app.use(bodyParser.json());

// Use cors middleware with specified options
app.use(cors({
   
}));

// Registration endpoint
app.post('/api/register', async (req, res) => {
    console.log('Received registration request:', req.body);
    const { firstName, lastName, email, password, rePassword, phoneNumber } = req.body;

    // Validation checks (you can add more as needed)
    if (!firstName || !lastName || !email || !password || !rePassword || !phoneNumber) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== rePassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Hashing the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user into the database
    db.query(
        'INSERT INTO app_users (first_name, last_name, password, email, phonenumber) VALUES (?, ?, ?, ?, ?)',
        [firstName, lastName, hashedPassword, email, phoneNumber],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            res.json({ message: 'User registered successfully' });
        }
    );
});

// Get all users endpoint
app.get('/api/users', (req, res) => {
    // Retrieve all users from the app_users table
    db.query('SELECT * FROM app_users', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        res.json({ users: results });
    });
});



// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
