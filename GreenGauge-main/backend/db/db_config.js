// backend/db/db_config.js
require('dotenv').config(); // Load environment variables from a .env file

const mysql = require('mysql2');

// Create a connection pool using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionLimit: 10, // Adjust the connection limit as needed
});

// Function to query data using the connection pool
function getQuery(query, params, callback) {
  pool.query(query, params, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
}

// Export the connection pool and query function
module.exports = { pool, getQuery };
