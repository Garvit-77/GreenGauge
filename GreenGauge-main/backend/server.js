// server.js

require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { getQuery } = require('./db/db_config'); // Import the database query function
const Papa = require('papaparse');
const axios = require('axios');
const fs = require('fs');
const app = express();
const PORT = process.env.SERVER_PORT || 10000; // Use environment port or default to 5000

// Define the path where the CSV file is stored
const csvFilePath = `${process.env.DEVICE_FILE_PATH}/Final_data.csv`;

// Import bcrypt for password comparison
const bcrypt = require('bcrypt');

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse incoming JSON requests

// Test route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    // Validate incoming data
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
  
    // Query the database for the user
    const query = 'SELECT * FROM Users WHERE username = ?';
    getQuery(query, [username], async (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }

      console.log('Database results:', results);  // Debugging line to check results

      // Check if user exists
      if (results.length > 0) {
        const user = results[0];

        console.log('User found:', user);  // Debugging line to check if user is correct

        // Compare the provided password with the hashed password
        const match = await bcrypt.compare(password, user.password);
        if (match) {
          console.log('Password match successful');  // Debugging line for password match
          
          // Send the id and username in the response
          res.json({ 
            success: true, 
            message: 'Login successful', 
            user: { id: user.id, username: user.username } 
          });
        } else {
          console.log('Password mismatch');  // Debugging line for failed password match
          res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
      } else {
        console.log('User not found');  // Debugging line for user not found
        res.status(401).json({ success: false, message: 'Invalid username or password' });
      }
    });
});
  

// Register route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
  
    // Validate incoming data
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
  
    try {
      // Hash the password for secure storage
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insert the new user into the database
      const query = 'INSERT INTO Users (username, password) VALUES (?, ?)';
      getQuery(query, [username, hashedPassword], (err, results) => {
        if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        res.json({ success: true, message: 'User registered successfully' });
      });
    } catch (error) {
      console.error('Error hashing password:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

app.get('/getDevices', (req, res) => {
    const userId = req.query.userId;  // Assuming userId is passed as a query parameter

    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Query to get devices for the given userId
    const query = 'SELECT * FROM Devices WHERE userid = ?';
    getQuery(query, [userId], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        if (results.length > 0) {
            res.json({ success: true, devices: results });
            console.log(results);
        } else {
            res.json({ success: false, message: 'No devices found for this user' });
        }
    });
});

app.post('/addDevices', (req, res) => {
    console.log(req.body)
    const { selectedType: type, selectedManufacturer: manufacturer, selectedModel: model, username, id } = req.body;

    console.log(type, manufacturer, model, username, id);

    // Check if all required data is provided
    if (!type || !manufacturer || !model || !username || !id) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if CSV file exists
    if (!fs.existsSync(csvFilePath)) {
        return res.status(400).json({ success: false, message: 'CSV file not found' });
    }

    const file = fs.readFileSync(csvFilePath, 'utf8');

    // Parse the CSV file using PapaParse
    Papa.parse(file, {
        header: true,
        complete: (results) => {
            const parsedData = results.data;

            // console.log("CSV Loaded successfully", results.data);

            // Extract unique values from CSV data
            const deviceTypes = [...new Set(parsedData.map(item => item.subcategory || ''))];
            const manufacturers = [...new Set(parsedData.map(item => item.manufacturer || ''))];
            const deviceModels = [...new Set(parsedData.map(item => item.name ? item.name.trim() : ''))];

            // Validate the type, manufacturer, and model against the CSV data
            if (!deviceTypes.includes(type)) {
                return res.status(400).json({ success: false, message: 'Invalid device type' });
            }

            if (!manufacturers.includes(manufacturer)) {
                return res.status(400).json({ success: false, message: 'Invalid manufacturer' });
            }

            if (!deviceModels.includes(model)) {
                return res.status(400).json({ success: false, message: 'Invalid device model' });
            }

            // Insert the device into the database associated with the user
            const query = 'INSERT INTO Devices (type, manufacturer, model, userid) VALUES (?, ?, ?, ?)';
            getQuery(query, [type, manufacturer, model, id], (err, results) => {
                if (err) {
                    console.error('Error inserting device into database:', err);
                    return res.status(500).json({ success: false, message: 'Error adding device to the database' });
                }

                res.json({ success: true, message: 'Device added successfully' });
            });
        },
        error: (error) => {
            console.error('Error parsing CSV file:', error);
            res.status(500).json({ success: false, message: 'Error parsing CSV file' });
        }
    });
});

app.post('/updateDeviceEmissions', (req, res) => {
    const { deviceid, lifetime, gwp_total } = req.body;
    console.log(lifetime, gwp_total);

    // Check if all required data is provided
    if (!deviceid || !lifetime || !gwp_total) {
        return res.status(400).json({ success: false, message: 'Device ID, lifetime, and GWP total are required' });
    }

    // Calculate the emission
    const emission = parseFloat(lifetime) * parseFloat(gwp_total);
    if (isNaN(emission)) {
        return res.status(400).json({ success: false, message: 'Invalid values for lifetime or GWP total' });
    }

    // SQL Update Query to update the MFEmissions for the given deviceid
    const query = 'UPDATE Devices SET MFEmissions = ? WHERE deviceid = ?';

    getQuery(query, [emission, deviceid], (err, results) => {
        if (err) {
            console.error('Error updating emissions in the database:', err);
            return res.status(500).json({ success: false, message: 'Error updating emissions' });
        }

        res.json({ success: true, message: 'Device emissions updated successfully', emission });
    });
});

app.get('/getDeviceDetails', (req, res) => {
    const deviceId = req.query.deviceid;  // Assuming deviceid is passed as a query parameter

    if (!deviceId) {
        return res.status(400).json({ success: false, message: 'Device ID is required' });
    }

    // Query to get the details for the given deviceId
    const query = 'SELECT * FROM Devices WHERE deviceid = ?';
    getQuery(query, [deviceId], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        if (results.length > 0) {
            res.json({ success: true, device: results[0] }); // Return the details of the specific device
        } else {
            res.json({ success: false, message: 'Device not found' });
        }
    });
});

// Store emissions data
app.post('/storeUsageEmissions', (req, res) => {
    console.log(req.body);
    const { deviceid, userid, power, timeElapsed, USEmissions } = req.body;

    // Validate the input data
    if (!deviceid || !userid || power === undefined || timeElapsed === undefined || USEmissions === undefined) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Insert the data into the UsageEmissions table
    const query = `
        INSERT INTO UsageEmissions (deviceid, userid, power, timeElapsed, USEmissions)
        VALUES (?, ?, ?, ?, ?)
    `;

    const values = [deviceid, userid, power, timeElapsed, USEmissions];

    getQuery(query, values, (err, results) => {
        if (err) {
            console.error('Error inserting data into UsageEmissions:', err);
            return res.status(500).json({ success: false, message: 'Error storing emissions data' });
        }

        res.json({ success: true, message: 'Emissions data stored successfully', data: results });
    });
});

// Route to store energy data
app.post('/storeEnergyData', (req, res) => {
    const { deviceid, current, voltage, power, energy, MFEmissions } = req.body;

    if (!deviceid || current === undefined || voltage === undefined || power === undefined || energy === undefined || MFEmissions === undefined) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const sql = `INSERT INTO EnergyData (deviceid, current, voltage, power, energy, MFEmissions) VALUES (?, ?, ?, ?, ?, ?)`;
    getQuery(sql, [deviceid, current, voltage, power, energy, MFEmissions], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        res.json({ success: true, message: 'Data stored successfully' });
    });
});

// Route to fetch energy data for a given user
app.get('/fetchEnergyData', (req, res) => {
    const { deviceid } = req.query;

    if (!deviceid) {
        return res.status(400).json({ success: false, message: 'Device ID is required' });
    }

    const sql = `SELECT * FROM EnergyData WHERE deviceid = ?`;
    getQuery(sql, [deviceid], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        if (results.length > 0) {
            res.json({ success: true, energyData: results });
        } else {
            res.json({ success: false, message: 'No energy data found for this user' });
        }
    });
});

// Route to truncate the entire EnergyData table
app.post('/truncateEnergyData', (req, res) => {
    const sql = 'TRUNCATE TABLE EnergyData';  // This will remove all rows from the EnergyData table
    getQuery(sql, (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        res.json({ success: true, message: 'Energy data truncated successfully' });
    });
});

// Route to store average energy data
app.post('/storeAverageEnergyData', (req, res) => {
    const { deviceid, userid, avgCurrent, avgVoltage, avgPower, avgEnergy, timeElapsed } = req.body;

    console.log(deviceid, userid, avgCurrent, avgVoltage, avgPower, avgEnergy, timeElapsed)
    if (!deviceid || !userid || avgCurrent === undefined || avgVoltage === undefined || avgPower === undefined || avgEnergy === undefined || timeElapsed === undefined) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const sql = `INSERT INTO AverageEnergyData (deviceid, userid, avgCurrent, avgVoltage, avgPower, avgEnergy, timeElapsed) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    getQuery(sql, [deviceid, userid, avgCurrent, avgVoltage, avgPower, avgEnergy, timeElapsed], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        res.json({ success: true, message: 'Average data stored successfully' });
    });
    
});

// Route to fetch energy data for a given user
app.get('/fetchRecentAverageEnergyData', (req, res) => {
    const sqlSelect = `SELECT sessionID FROM AverageEnergyData ORDER BY timestamp DESC LIMIT 1`;
    getQuery(sqlSelect, [], (selectErr, results) => {
        if (selectErr) {
            console.error('Database query error during selection:', selectErr);
            return res.status(500).json({ success: false, message: 'Internal server error while retrieving session ID' });
        }          

        if (results.length > 0) {
            res.json({ success: true, recentSessionID: results[0].sessionID });
        } else {
            res.json({ success: false, message: 'No energy data found for this user' });
        }
    });
});

// Route to store average energy data
app.post('/storeChargingEmissionsData', (req, res) => {
    const { sessionID, deviceid, userid, PCEmissions } = req.body;

    console.log(sessionID, deviceid, userid, PCEmissions);

    if (!sessionID || !deviceid || !userid || PCEmissions === undefined) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const sql = `INSERT INTO ChargingEmissions (sessionID, deviceid, userid, PCEmissions) VALUES (?, ?, ?, ?)`;
    getQuery(sql, [sessionID, deviceid, userid, PCEmissions], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        res.json({ success: true, message: 'Charging Emissions data stored successfully' });
    });
    
});

app.get('/fetchChargingViz', (req, res) => {
    const { userid, deviceid } = req.query; // Use req.query to extract query parameters

    // Check if userid and deviceid are provided
    if (!deviceid || !userid) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Use a parameterized query to prevent SQL injection
    const query = `SELECT a.timestamp, a.avgCurrent, a.avgVoltage, a.avgPower, a.avgEnergy, c.PCEmissions
                   FROM AverageEnergyData a
                   JOIN ChargingEmissions c ON a.sessionID = c.sessionID
                   WHERE a.userid = ? AND a.deviceid = ?
                   ORDER BY a.timestamp DESC;`;

    // Execute the query with the provided parameters
    getQuery(query, [userid, deviceid], (err, results) => {
        if (err) {
            console.error('Error fetching data: ', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        res.json(results);
    });
});

app.get('/fetchManufacturingViz', (req, res) => {
    const { userid } = req.query; // Use req.query to extract query parameters

    // Check if userid and deviceid are provided
    if (!userid) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Use a parameterized query to prevent SQL injection
    const query = `SELECT deviceid, MFEmissions FROM Devices WHERE userid = ?;`;

    // Execute the query with the provided parameters
    getQuery(query, [userid], (err, results) => {
        if (err) {
            console.error('Error fetching data: ', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        res.json(results);
        console.log(results);
    });
});

app.get('/fetchUserIds', (req, res) => {
    // Query to fetch all user IDs along with their corresponding usernames
    const query = `SELECT id, username FROM Users;`;

    // Execute the query to fetch user IDs and usernames
    getQuery(query, [], (err, results) => {
        if (err) {
            console.error('Error fetching user IDs and usernames: ', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        // Return the list of user IDs and usernames as a response
        res.json(results);
    });
});

// Route to fetch data from the database
app.get('/fetchData', (req, res) => {
    const { userid, deviceid } = req.query;
  
    // Validate the query parameters
    if (!userid || !deviceid) {
        return res.status(400).json({ error: 'Missing userid or deviceid' });
    }
  
    // SQL query to fetch data from the database
    const query = `
      SELECT a.timestamp, a.avgPower, a.timeElapsed, c.PCEmissions
      FROM AverageEnergyData a
      JOIN ChargingEmissions c ON a.sessionID = c.sessionID
      WHERE a.userid = ? AND a.deviceid = ?
      ORDER BY a.timestamp;
    `;
  
    // Fetch data from the database using the query
    getQuery(query, [userid, deviceid], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch data from DB' });
        }
  
        // Ensure there is data to send
        if (!results || results.length === 0) {
            return res.status(404).json({ error: 'No data found for the provided userid and deviceid' });
        }

        // Prepare data for the prediction
        const predictionData = results.map(result => ({
            avgPower: result.avgPower,
            timeElapsed: result.timeElapsed,
            PCEmissions: result.PCEmissions
        }));
  
        try {
            // Send the data to Flask for prediction (POST request)
            const response = await axios.post('http://127.0.0.1:10020/predict', { data: predictionData });
            // Send the prediction response back to the client
            res.json(response.data);
        } catch (error) {
            console.error('Error calling Flask API:', error.message || error);
            res.status(500).json({ error: 'Error during prediction' });
        }
    });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
