import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { useUser } from '../../context/UserContext/UserContext'; // Import the UserContext
import axios from 'axios'; // Import axios for making API requests
import './AddDevicePage.css'; // Import custom CSS file

const AddDevicePage = () => {
    const [data, setData] = useState([]);
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [deviceModels, setDeviceModels] = useState([]);
    const [selectedType, setSelectedType] = useState('');
    const [selectedManufacturer, setSelectedManufacturer] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const navigate = useNavigate();
    const { username, id } = useUser(); // Get username from context

    // Load data from CSV on component mount
    useEffect(() => {
        console.log("Starting CSV load...");

        Papa.parse(`${process.env.PUBLIC_URL}/Final_data.csv`, {
            download: true,
            header: true,
            complete: (results) => {
                console.log("CSV Loaded successfully", results.data);  // Log loaded CSV data
                const parsedData = results.data;
                setData(parsedData);

                // Extract unique device types
                const uniqueTypes = [...new Set(parsedData.map(item => item.subcategory || ''))];
                console.log("Unique device types:", uniqueTypes);  // Log unique device types
                setDeviceTypes(uniqueTypes);

                // Extract unique manufacturers
                const uniqueManufacturers = [...new Set(parsedData.map(item => item.manufacturer || ''))];
                console.log("Unique manufacturers:", uniqueManufacturers);  // Log unique manufacturers
                setManufacturers(uniqueManufacturers);

                // Extract unique models
                const uniqueModels = [...new Set(parsedData.map(item => item.name ? item.name.trim() : ''))];
                console.log("Unique models:", uniqueModels);  // Log unique models
                setDeviceModels(uniqueModels);
            },
            error: (error) => {
                console.error("Error loading the CSV file:", error);
            }
        });
    }, []);

    // Filter manufacturers based on selected device type
    useEffect(() => {
        if (selectedType) {
            const filteredManufacturers = [...new Set(data
                .filter(item => item.subcategory === selectedType)
                .map(item => item.manufacturer || ''))
            ];
            console.log("Filtered manufacturers for type", selectedType, ":", filteredManufacturers); // Log filtered manufacturers
            setManufacturers(filteredManufacturers);
            setSelectedManufacturer('');
            setSelectedModel('');
        }
    }, [selectedType, data]);

    // Filter models based on selected manufacturer
    useEffect(() => {
        if (selectedManufacturer) {
            const filteredModels = [...new Set(data
                .filter(item => item.subcategory === selectedType && item.manufacturer === selectedManufacturer)
                .map(item => item.name ? item.name.trim() : ''))
            ];
            console.log("Filtered models for manufacturer", selectedManufacturer, ":", filteredModels); // Log filtered models
            setDeviceModels(filteredModels);
            setSelectedModel('');
        }
    }, [selectedManufacturer, selectedType, data]);

    // Handle form submission and send data to the backend
    const handleAddDevice = async () => {
        console.log(selectedType, selectedManufacturer, selectedModel, username, id)
        if (selectedType && selectedManufacturer && selectedModel) {
            try {
                const response = await axios.post('http://localhost:10000/addDevices', {selectedType, selectedManufacturer, selectedModel, username, id});
    
                console.log(response); // Log the server response
    
                if (response.data.success) {
                    navigate('/dashboard'); // Redirect to dashboard on success
                } else {
                    alert('Error adding device');
                }
            } catch (error) {
                console.error('Error adding device:', error);
                alert(`An error occurred while adding the device: ${error.message}`);
            }
        } else {
            alert('Please select all fields');
        }
    };

    return (
        <div className="add-device-container">
            <div className="add-device-card">
                <h2 className="card-title">Add a Device</h2>
                <form className="add-device-form">
                    <div className="form-group">
                        <label htmlFor="deviceType">Device Type</label>
                        <select
                            id="deviceType"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            <option value="">Select a device type</option>
                            {deviceTypes.map((type, index) => (
                                <option key={index} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="manufacturer">Company</label>
                        <select
                            id="manufacturer"
                            value={selectedManufacturer}
                            onChange={(e) => setSelectedManufacturer(e.target.value)}
                            disabled={!selectedType}
                        >
                            <option value="">Select a company</option>
                            {manufacturers.map((manufacturer, index) => (
                                <option key={index} value={manufacturer}>{manufacturer}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="deviceModel">Device Model</label>
                        <select
                            id="deviceModel"
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            disabled={!selectedManufacturer}
                        >
                            <option value="">Select a device model</option>
                            {deviceModels.map((model, index) => (
                                <option key={index} value={model}>{model}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddDevice}
                        className="submit-button"
                    >
                        Add Device
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddDevicePage;
