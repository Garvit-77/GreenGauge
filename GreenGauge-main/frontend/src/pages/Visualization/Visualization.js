import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext/UserContext';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import html2canvas from 'html2canvas'; // Importing html2canvas
import './Visualization.css';

const DeviceInfo = () => {
  const navigate = useNavigate();
  const { deviceid } = useParams();
  const { username, id } = useUser();
  const [deviceDetails, setDeviceDetails] = useState(null);
  const [chargingVizData, setChargingVizData] = useState(null);
  const [manufacturingVizData, setManufacturingVizData] = useState(null);
  const [dataPoints, setDataPoints] = useState(10);
  const [downloadTime, setDownloadTime] = useState(null); // State for download time

  // References to capture charts
  const chargingChartRef = useRef();
  const manufacturingChartRef = useRef();

  // Colors for PieChart
  const COLORS = ['#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#FF0000', '#AA00FF'];

  // Function to convert UTC timestamp to IST and format it
  const convertToIST = (timestamp) => {
    const date = new Date(timestamp);
    const offsetIST = 5.5 * 60; // 5 hours 30 minutes in minutes
    const istDate = new Date(date.getTime() + offsetIST * 60 * 1000);
    const day = String(istDate.getDate()).padStart(2, '0');
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const year = istDate.getFullYear();
    const hours = String(istDate.getHours()).padStart(2, '0');
    const minutes = String(istDate.getMinutes()).padStart(2, '0');
    const seconds = String(istDate.getSeconds()).padStart(2, '0');
    const milliseconds = String(istDate.getMilliseconds()).padStart(3, '0');
    return `${day}-${month}-${year}T${hours}:${minutes}:${seconds}:${milliseconds}`;
  };

  useEffect(() => {
    const fetchDeviceDetails = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER_PATH}/getDeviceDetails`, {
          params: { deviceid }
        });
        if (response.data.success) {
          setDeviceDetails(response.data.device);
        }
      } catch (error) {
        console.error('Error fetching device details:', error);
      }
    };
    if (deviceid) fetchDeviceDetails();
  }, [deviceid]);

  useEffect(() => {
    const fetchChargingVizData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER_PATH}/fetchChargingViz`, {
          params: { userid: id, deviceid }
        });
        if (response.status === 200) {
          const formattedData = response.data.map(item => ({
            ...item,
            timestamp: convertToIST(item.timestamp)
          }));
          setChargingVizData(formattedData);
        }
      } catch (error) {
        console.error('Error fetching charging visualization data:', error);
      }
    };
    fetchChargingVizData();
  }, [id, deviceid]);

  useEffect(() => {
    const fetchManufacturingVizData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER_PATH}/fetchManufacturingViz`, {
          params: { userid: id }
        });
        if (response.status === 200) {
          const formattedData = response.data.map(item => ({
            deviceid: item.deviceid,
            MFEmissions: item.MFEmissions
          }));
          setManufacturingVizData(formattedData);
        }
      } catch (error) {
        console.error('Error fetching manufacturing visualization data:', error);
      }
    };
    fetchManufacturingVizData();
  }, [id]);

  const handleDataPointsChange = (event) => {
    setDataPoints(Number(event.target.value));
  };

  const filteredChargingData = chargingVizData ? chargingVizData.slice(0, dataPoints) : [];

  // Function to render the PieChart with two parts: current device and others combined
  const renderPieChart = () => {
    if (!manufacturingVizData) return <p>Loading manufacturing visualization data...</p>;

    // Calculate emissions for the current device and combine emissions for all other devices
    let currentDeviceEmissions = 0;
    let otherDevicesEmissions = 0;
    let totalEmissions = 0;

    manufacturingVizData.forEach((entry) => {
      totalEmissions += entry.MFEmissions; // Sum all emissions
      if (entry.deviceid == deviceid) {
        currentDeviceEmissions += entry.MFEmissions;
      } else {
        otherDevicesEmissions += entry.MFEmissions;
      }
    });

    const pieData = [
      { name: 'Current Device', MFEmissions: currentDeviceEmissions },
      { name: 'Other Devices', MFEmissions: otherDevicesEmissions },
    ];

    const renderCustomLabel = ({ name, value }) => `${name}: ${value} kg CO2e`;

    const renderCustomTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
        const { name, value } = payload[0];
        return (
          <div className="custom-tooltip">
            <p>{`${name}: ${value} kg CO2e`}</p>
          </div>
        );
      }
      return null;
    };

    return (
      <div>
        <ResponsiveContainer width="100%" height={500}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="MFEmissions"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={150}
              fill="#8884d8"
              label={renderCustomLabel}
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? COLORS[0] : COLORS[1]}
                />
              ))}
            </Pie>
            <Tooltip content={renderCustomTooltip} />
          </PieChart>
        </ResponsiveContainer>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Total Manufacturing Emissions: {totalEmissions} kg CO2e
        </p>
      </div>
    );
  };

  // Function to download the report with images
  const handleDownloadReport = async () => {
    const currentDateTime = new Date().toLocaleString();
    setDownloadTime(currentDateTime);

    // Capture charts as images
    const chargingChartImage = await html2canvas(chargingChartRef.current).then(canvas => canvas.toDataURL());
    const manufacturingChartImage = await html2canvas(manufacturingChartRef.current).then(canvas => canvas.toDataURL());

    const reportContent = `
      <html>
        <head><title>Device Report</title></head>
        <body>
          <h1>Device Information</h1>
          <p><strong>Device ID:</strong> ${deviceDetails?.deviceid}</p>
          <p><strong>Type:</strong> ${deviceDetails?.type}</p>
          <p><strong>Manufacturer:</strong> ${deviceDetails?.manufacturer}</p>
          <p><strong>Model:</strong> ${deviceDetails?.model}</p>
          
          <h2>Charging Visualization Data</h2>
          <img src="${chargingChartImage}" alt="Charging Visualization Chart" />
          
          <h2>Manufacturing Visualization Data</h2>
          <img src="${manufacturingChartImage}" alt="Manufacturing Visualization Chart" />
          
          <p><strong>Report generated at:</strong> ${currentDateTime}</p>
        </body>
      </html>
    `;

    const blob = new Blob([reportContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `device_report_${deviceid}_${currentDateTime.replace(/[\/: ]/g, '-')}.html`;
    link.click();
  };

  // Render function includes references to the charts
  return (
    <div className="device-info-container">
      <h1>Device Information</h1>
      {deviceDetails ? (
        <div className="device-details">
          <p><strong>Device ID:</strong> {deviceDetails.deviceid}</p>
          <p><strong>Type:</strong> {deviceDetails.type}</p>
          <p><strong>Manufacturer:</strong> {deviceDetails.manufacturer}</p>
          <p><strong>Model:</strong> {deviceDetails.model}</p>
        </div>
      ) : (
        <p>Loading device details...</p>
      )}
      
      <h2>Charging Visualization Data</h2>
      <div>
        <label htmlFor="data-points">Number of Data Points:</label>
        <input
          type="number"
          id="data-points"
          value={dataPoints}
          onChange={handleDataPointsChange}
          min="1"
          max="100"
        />
      </div>
      
      {filteredChargingData.length > 0 ? (
        <div ref={chargingChartRef}>
          <ResponsiveContainer width="90%" height={500}>
            <LineChart data={filteredChargingData} margin={{ top: 20, right: 30, bottom: 140, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" angle={-45} textAnchor="end" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend verticalAlign="top" height={50} wrapperStyle={{ top: 20 }} layout="horizontal" />
              <Line yAxisId="left" type="monotone" dataKey="avgPower" stroke="#8884d8" />
              <Line yAxisId="left" type="monotone" dataKey="avgEnergy" stroke="#82ca9d" />
              <Line yAxisId="right" type="monotone" dataKey="PCEmissions" stroke="#ff7300" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p>Loading charging visualization data...</p>
      )}
      
      <h2>Manufacturing Visualization Data</h2>
      <div ref={manufacturingChartRef}>
        {renderPieChart()}
      </div>

      <button onClick={handleDownloadReport}>Download Report</button>
      {downloadTime && <p>Report downloaded at: {downloadTime}</p>}
    </div>
  );
};

export default DeviceInfo;
