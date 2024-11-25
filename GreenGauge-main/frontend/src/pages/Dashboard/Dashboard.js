// Dashboard.js
import React, { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext/UserContext';
import { Link } from 'react-router-dom'; // Import Link for navigation
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
    const { username, id } = useUser(); // Get the logged-in username and id from context
    const [devices, setDevices] = useState([]); // State to store devices

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_SERVER_PATH}/getDevices`, {
                    params: { userId: id }, // Pass the user id to fetch devices for that user
                });
                if (response.data.success) {
                    setDevices(response.data.devices); // Set devices in state
                } else {
                    console.log('No devices found for this user');
                }
            } catch (error) {
                console.error('Error fetching devices:', error);
            }
        };

        if (id) {
            fetchDevices(); // Fetch devices when id is available
        }
    }, [id]); // Run the effect when the user id changes

    return (
        <div className="dashboard">
            <h1>Welcome to your Dashboard</h1>
            <p>UserID: {id}</p>
            <p>Username: {username}</p>

            <div className="dashboard-info">
                <h2>Your Devices</h2>

                {/* Display devices in 3 per row */}
                <div className="device-cards">
                    {devices.map((device) => (
                        <Link
                            key={device.deviceid}
                            to={`/device-info/${device.deviceid}`} // Navigate to DeviceInfo page with deviceid as a parameter
                            className="device-card-link" // Optionally, add a CSS class for styling the link
                        >
                            <div className="device-card">
                                <h3>{device.type}</h3>
                                <p>Manufacturer: {device.manufacturer}</p>
                                <p>Model: {device.model}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Add Device Section */}
            <div className="add-device-section">
                <h2>Add a New Device</h2>
                <Link to="/add-device">
                    <button className="add-device-btn">Add Device</button>
                </Link>
            </div>
        </div>
    );
};

export default Dashboard;
