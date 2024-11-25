// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.ESPCONN_PORT || 10010;

// Middleware
app.use(cors());

// Fetch data from ESP32
app.get('/api/data', async (req, res) => {
    try {
        console.log(process.env.ESPCONN_URL)
        const response = await axios.get(process.env.ESPCONN_URL);
        const html = response.data;

        const Vrms = html.match(/Vrms: ([\d.]+)/)[1];
        const Irms = html.match(/Irms: ([\d.]+)/)[1];
        const Power = html.match(/Power: ([\d.]+)/)[1];
        const kWh = html.match(/kWh: ([\d.]+)/)[1];

        res.json({ status: 'connected', data: { Vrms, Irms, Power, kWh } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error fetching data from ESP32' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
