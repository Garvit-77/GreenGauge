import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { useUser } from '../../context/UserContext/UserContext'; // Assuming you use a context to provide user information

function SmartPlug({ deviceID }) {
    const [data, setData] = useState({ Vrms: 'Loading...', Irms: 'Loading...', Power: 'Loading...', kWh: 'Loading...' });
    const [storing, setStoring] = useState(false);
    const [intervalId, setIntervalId] = useState(null);
    const [status, setStatus] = useState('loading');
    const [startTime, setStartTime] = useState(null);
    const [latestReadings, setLatestReadings] = useState({ avgVrms: 'N/A', avgIrms: 'N/A', avgPower: 'N/A', avgkWh: 'N/A' });
    const [efData, setEfData] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedEF, setSelectedEF] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(null);
    const { username, id } = useUser(); // Get username and userid from context

    // Load and parse the EF CSV file
    useEffect(() => {
        const fetchEfData = async () => {
            try {
                const response = await fetch('/EF_Electricity_Grid.csv');
                const csvText = await response.text();

                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (result) => {
                        const filteredData = result.data
                            .filter(item => item.Country); // Ensure country is defined
                        setEfData(filteredData);
                    },
                });
            } catch (error) {
                console.error('Error fetching EF data:', error);
            }
        };

        fetchEfData();
    }, []);

    const handleCountryChange = (e) => {
        const country = e.target.value;
        setSelectedCountry(country);

        // Find the EF for the selected country
        const countryData = efData.find(item => item.Country === country);
        if (countryData) {
            setSelectedEF(countryData.EF);
        } else {
            setSelectedEF(null);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_ESPCONN_PATH}/api/data`);
                if (response.data.status === 'connected') {
                    setData(response.data.data);
                    setStatus('connected');
                } else {
                    setStatus('error');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setStatus('error');
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000); // Fetch data every 5 seconds

        return () => clearInterval(interval); // Clean up on component unmount
    }, []);

    const startStoringData = () => {
        if (!storing) {
            setStoring(true);
            setStartTime(new Date());

            const id = setInterval(async () => {
                try {
                    const response = await axios.get(`${process.env.REACT_APP_ESPCONN_PATH}/api/data`);
                    if (response.data.status === 'connected') {
                        const { Vrms, Irms, Power, kWh } = response.data.data;

                        await axios.post(`${process.env.REACT_APP_SERVER_PATH}/storeEnergyData`, {
                            deviceid: deviceID,
                            current: parseFloat(Irms),
                            voltage: parseFloat(Vrms),
                            power: parseFloat(Power),
                            energy: parseFloat(kWh),
                            MFEmissions: selectedEF * parseFloat(kWh)
                        });
                    }
                } catch (error) {
                    console.error('Error storing data:', error);
                }
            }, 5000);
            setIntervalId(id);
        }
    };

    const stopStoringData = async () => {
        setStoring(false);
        if (intervalId) {
            clearInterval(intervalId);
        }
    
        try {
            const response = await axios.get(`${process.env.REACT_APP_SERVER_PATH}/fetchEnergyData?deviceid=${deviceID}`);
            const energyData = Array.isArray(response.data) ? response.data : response.data.energyData || [];
    
            if (energyData.length === 0) {
                console.warn('No energy data available');
                return;
            }

            console.log(energyData);
    
            let sumVrms = 0, sumIrms = 0, sumPower = 0, sumkWh = 0, count = 0;
            energyData.forEach(data => {
                sumVrms += data.voltage || 0;
                sumIrms += data.current || 0;
                sumPower += data.power || 0;
                sumkWh += data.energy || 0;
                count++;
            });

            console.log(sumVrms);
    
            if (count > 0) {
                const avgVrms = (sumVrms / count).toFixed(3);
                const avgIrms = (sumIrms / count).toFixed(3);
                const avgPower = (sumPower / count).toFixed(3);
                const avgkWh = (sumkWh / count).toFixed(3);
    
                const endTime = new Date();
                const elapsed = ((endTime - startTime) / 1000).toFixed(3);
                setElapsedTime(elapsed);
    
                const carbonEmissions = (selectedEF ? selectedEF * avgPower * elapsed * 0.001: 0).toFixed(3);
    
                await axios.post(`${process.env.REACT_APP_SERVER_PATH}/storeAverageEnergyData`, {
                    deviceid: deviceID,
                    userid: id,
                    avgCurrent: avgIrms,
                    avgVoltage: avgVrms,
                    avgPower: avgPower,
                    avgEnergy: avgkWh,
                    timeElapsed: elapsed
                });
    
                // Truncate the entire EnergyData table after storing average energy data
                await axios.post(`${process.env.REACT_APP_SERVER_PATH}/truncateEnergyData`);
    
                const response2 = await axios.get(`${process.env.REACT_APP_SERVER_PATH}/fetchRecentAverageEnergyData`);
                const energyData2 = response2.data;
                console.log(energyData2);
                await axios.post(`${process.env.REACT_APP_SERVER_PATH}/storeChargingEmissionsData`, {
                    sessionID: energyData2.recentSessionID,
                    deviceid: deviceID,
                    userid: id,
                    PCEmissions: carbonEmissions
                });
    
                setLatestReadings({
                    avgVrms: avgVrms || 'N/A',
                    avgIrms: avgIrms || 'N/A',
                    avgPower: avgPower || 'N/A',
                    avgkWh: avgkWh || 'N/A',
                    PCE: carbonEmissions || 'N/A'
                });
            }
        } catch (error) {
            console.error('Error stopping data storage:', error);
        }
    };
    

    return (
        <div className="container my-4">
            <h4>Energy Monitoring</h4>
            <div className="card mb-4">
                <div className="card-body">
                    {status === 'connected' ? (
                        <>
                            <p><strong>Vrms:</strong> {data.Vrms} V</p>
                            <p><strong>Irms:</strong> {data.Irms} A</p>
                            <p><strong>Power:</strong> {data.Power} W</p>
                            <p><strong>kWh:</strong> {data.kWh} kWh</p>
                        </>
                    ) : (
                        <p>Loading...</p>
                    )}
                </div>
            </div>

            <h5>Country Emission Factor (EF)</h5>
            <div className="form-group">
                <label htmlFor="countrySelect">Select Country:</label>
                <select
                    id="countrySelect"
                    className="form-control"
                    value={selectedCountry}
                    onChange={handleCountryChange}
                >
                    <option value="">Select a country</option>
                    {efData.sort((a, b) => a.Country.localeCompare(b.Country)).map((item, index) => (
                        <option key={index} value={item.Country}>{item.Country}</option>
                    ))}
                </select>
            </div>


            <div className="d-flex justify-content-between mt-4">
                <button
                    className={`btn ${storing ? 'btn-danger' : 'btn-primary'}`}
                    onClick={storing ? stopStoringData : startStoringData}
                >
                    {storing ? 'Stop Storing Data' : 'Start Storing Data'}
                </button>
            </div>

            {elapsedTime && (
                <div className="mt-3">
                    <h5>Latest Averages:</h5>
                    <p><strong>Average Vrms:</strong> {latestReadings.avgVrms} V</p>
                    <p><strong>Average Irms:</strong> {latestReadings.avgIrms} A</p>
                    <p><strong>Average Power:</strong> {latestReadings.avgPower} W</p>
                    <p><strong>Average kWh:</strong> {latestReadings.avgkWh} kWh</p>
                    {/* <p><strong>Primary Carbon Emissions:</strong> {latestReadings.PCE} kg CO2e</p> */}
                    <p><strong>Elapsed Time:</strong> {elapsedTime} seconds</p>
                </div>
            )}

            <div className="mt-3">
                <p><strong>Selected Country:</strong> {selectedCountry}</p>
                <p><strong>EF:</strong> {selectedEF} kg CO2e/kWh</p>
                <p><strong>Emissions:</strong> {latestReadings.PCE} kg CO2e</p>
            </div>
        </div>
    );
}

export default SmartPlug;
