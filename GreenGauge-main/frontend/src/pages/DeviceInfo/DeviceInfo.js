// DeviceInfo.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useParams to get the deviceid from the URL
import { useUser } from '../../context/UserContext/UserContext'; // Import your context
import axios from 'axios';
import Papa from 'papaparse';
import SmartPlug from '../../components/SmartPlug/SmartPlug';
import './DeviceInfo.css'; // Import CSS for styling

const DeviceInfo = () => {
    const navigate = useNavigate();
    const { deviceid } = useParams(); // Get the deviceid from the URL
    const { username, id } = useUser(); // Get the logged-in username and id from context
    const [deviceDetails, setDeviceDetails] = useState(null); // State to store device details
    const [csvData, setCsvData] = useState([]);
    const [efData, setEfData] = useState([]);
    const [carbonEmission, setCarbonEmission] = useState(null);
    const [calculatedEmissions, setCalculatedEmissions] = useState(null);
    const [powerConsumed, setPowerConsumed] = useState('');
    const [time, setTime] = useState({ hours: 0, minutes: 0 });
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedEF, setSelectedEF] = useState(null);

    useEffect(() => {
        const fetchDeviceDetails = async () => {
            try {
                console.log('Fetching device details...'); // Debugging line
                console.log(`Device ID: ${deviceid}`); // Debugging line
                console.log(process.env.SERVER_PATH);
                const response = await axios.get(`${process.env.REACT_APP_SERVER_PATH}/getDeviceDetails`, {
                    params: { deviceid } // Only pass deviceid, as userId is not needed for this API
                });

                console.log('Response from API:', response); // Debugging line
                if (response.data.success) {
                    console.log('Device details fetched successfully:', response.data.device); // Debugging line
                    setDeviceDetails(response.data.device); // Set the device details in state
                } else {
                    console.log('No details found for this device'); // Debugging line
                }
            } catch (error) {
                console.error('Error fetching device details:', error); // Debugging line
            }
        };

        if (deviceid) {
            fetchDeviceDetails(); // Fetch device details when deviceid is available
        } else {
            console.log('Device ID is not available'); // Debugging line
        }
    }, [deviceid]); // Only depend on deviceid

    useEffect(() => {
        console.log('Loading CSV data for manufacturing emissions');
        Papa.parse(`${process.env.PUBLIC_URL}/Final_data.csv`, {
            download: true,
            header: true,
            complete: (results) => {
                console.log('CSV data loaded:', results.data);
                setCsvData(results.data);
            },
            error: (error) => {
                console.error('Error loading CSV file:', error);
            }
        });
        console.log(csvData);
    }, []);

    useEffect(() => {
        console.log('Loading EF data');
        const fetchEfData = async () => {
            try {
                const response = await fetch('/EF_Electricity_Grid.csv');
                const csvText = await response.text();

                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (result) => {
                        console.log('EF data loaded:', result.data);
                        const filteredData = result.data.filter(item => item.Country); // Ensure country is defined
                        setEfData(filteredData);
                    },
                });

                console.log(efData);
            } catch (error) {
                console.error('Error fetching EF data:', error);
            }
        };

        fetchEfData();
    }, []);

    useEffect(() => {
        if (deviceDetails && csvData.length > 0) {
            const { type, manufacturer, model } = deviceDetails;

            console.log('Calculating manufacturing emission for device:', {
                type,
                manufacturer,
                model,
            });

            // Calculate manufacturing carbon emission
            const selectedData = csvData.find(item =>
                item.subcategory === type &&
                item.manufacturer === manufacturer &&
                item.name.trim() === model
            );

            if (selectedData) {
                const { lifetime, gwp_total } = selectedData;
                const emission = parseFloat(lifetime) * parseFloat(gwp_total);
                console.log('Calculated manufacturing emission:', emission);
                setCarbonEmission(emission);

                const updateDeviceData = async () => {
                    try {
                        // Prepare the data to send in the POST request
                        const requestData = {
                            deviceid,      // Device ID
                            lifetime: lifetime, // Lifetime value (ensure it's available)
                            gwp_total: gwp_total // GWP value (ensure it's available)
                        };
                
                        // Send POST request to update device emissions using axios
                        const response = await axios.post(`${process.env.REACT_APP_SERVER_PATH}/updateDeviceEmissions`, {
                            deviceid: deviceid,       // Device ID
                            lifetime: lifetime, // Lifetime value (ensure it's available)
                            gwp_total: gwp_total
                        }
                        );
                
                        // Check for successful response
                        if (response.status === 200) {
                            console.log('Device emissions updated:', response.data.emission);
                        } else {
                            console.error('Error updating emissions:', response.data.message);
                        }
                    } catch (error) {
                        console.error('Error sending update request:', error);
                    }
                };                

                updateDeviceData();
            } else {
                console.log('No matching data found for the device.');
                setCarbonEmission(null);
            }
        }
    }, [deviceDetails, csvData, id]);

    const handleCalculateEmissions = async () => {
        // Validate inputs
        if (!powerConsumed || !time.hours || !selectedEF) {
            console.error('Missing input values: power consumed, time, or EF data.');
            return;
        }

        // Calculate energy consumed in kWh
        const energyConsumed = (parseFloat(powerConsumed) || 0) * (parseFloat(time.hours) + parseFloat(time.minutes) / 60);
        console.log('Energy consumed:', energyConsumed);

        if (isNaN(energyConsumed)) {
            console.error('Invalid energy calculation.');
            return;
        }

        // Calculate carbon emissions
        const emissions = (energyConsumed * (selectedEF || 0)).toFixed(3);
        console.log('Calculated carbon emissions:', emissions);
        setCalculatedEmissions(emissions);

        // Calculate total time elapsed
        const timeElapsed = (parseFloat(time.hours) + parseFloat(time.minutes)/60).toFixed(3);

        // Send the data to the backend for storing
        const requestData = {
            deviceid,
            userid: id,
            power: powerConsumed,
            timeElapsed,
            USEmissions: emissions,
        };

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_SERVER_PATH}/storeUsageEmissions`,
                requestData
            );

            if (response.status === 200) {
                console.log('Emissions data stored successfully.');
            } else {
                console.error('Error storing emissions data:', response.data.message);
            }
        } catch (error) {
            console.error('Error sending data to backend:', error);
        }
    };

    const handleCountryChange = (e) => {
        const country = e.target.value;
        setSelectedCountry(country);

        console.log('Selected country:', country);

        // Find the EF for the selected country
        const countryData = efData.find(item => item.Country === country);
        if (countryData) {
            setSelectedEF(countryData.EF);
            console.log('Selected EF:', countryData.EF);
        } else {
            setSelectedEF(null);
        }
    };

    const handleNavigateToVisualization = () => {
        console.log('Navigating to visualization with ID:', deviceid);
        navigate(`/visualization/${deviceid}`);
    };

    const handleNavigateToPrediction = () => {
        console.log('Navigating to prediction with ID:', deviceid);
        navigate(`/prediction/${deviceid}`);
    };

    if (!deviceDetails) {
        return <p>Loading device details...</p>; // Show a loading message while fetching
    }

    return (
        <div className="container mt-4">
            <div className="device-info card mb-4">
                <h1>Device Information</h1>
                <p>Device ID: {deviceid}</p>
                <p>Associated User: {username}</p>
                <p>User ID: {id}</p>

                <div className="device-details">
                    <h2>{deviceDetails.type}</h2>
                    <p><strong>Manufacturer:</strong> {deviceDetails.manufacturer}</p>
                    <p><strong>Model:</strong> {deviceDetails.model}</p>
                    {/* Add more details as needed */}
                </div>

                {/* Navigation back to dashboard */}
                <div className="back-to-dashboard">
                    <a href="/dashboard">← Back to Dashboard</a>
                </div>
            </div>

            <div className="card mb-4">
                <div className="card-body">
                    <h3>Manufacturing Emissions</h3>
                    {carbonEmission !== null ? (
                        <p>Calculated Manufacturing Emission: <strong>{carbonEmission.toFixed(2)} kg CO2e</strong></p>
                    ) : (
                        <p>No data available for emission calculation.</p>
                    )}
                </div>
            </div>

            <div className="card mb-4">
                <div className="card-body">
                    <h3>Indirect Power Consumption Emissions</h3>
                    <SmartPlug deviceID={deviceid} />
                </div>
            </div>

            <div className="card mb-4">
                <div className="card-body">
                    <h3>Usage Emissions</h3>
                    <form>
                        <div className="form-group mb-3">
                            <label htmlFor="powerConsumed">Power Consumed (kW):</label>
                            <input
                                id="powerConsumed"
                                type="number"
                                className="form-control"
                                value={powerConsumed}
                                onChange={(e) => setPowerConsumed(e.target.value)}
                            />
                        </div>

                        <div className="form-group mb-3">
                            <label>Time Used:</label>
                            <div className="d-flex">
                                <div className="input-container">
                                    <input
                                        type="number"
                                        className="form-control me-2"
                                        placeholder="Hours"
                                        value={time.hours}
                                        onChange={(e) => setTime({ ...time, hours: e.target.value })}
                                    />
                                    <span className="input-unit">h</span>
                                </div>
                                <div className="input-container">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Minutes"
                                        value={time.minutes}
                                        onChange={(e) => setTime({ ...time, minutes: e.target.value })}
                                    />
                                    <span className="input-unit"> m</span>
                                </div>
                            </div>
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="country-select">Select a country:</label>
                            <select
                                id="country-select"
                                className="form-select"
                                value={selectedCountry}
                                onChange={handleCountryChange}
                            >
                                <option value="" disabled>Select a country</option>
                                {efData.map((item, index) => (
                                    <option key={index} value={item.Country}>{item.Country}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleCalculateEmissions}
                        >
                            Calculate Emissions
                        </button>

                        {calculatedEmissions !== null && (
                            <div className="mt-3">
                                <p>Total Carbon Emissions: <strong>{calculatedEmissions} kg CO2e</strong></p>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            <button className="btn btn-info mt-4" onClick={handleNavigateToVisualization}>
                View Report
            </button>

            <button className="btn btn-info mt-4" onClick={handleNavigateToPrediction}>
                View Predictions
            </button>

        </div>
    );
};

export default DeviceInfo;
