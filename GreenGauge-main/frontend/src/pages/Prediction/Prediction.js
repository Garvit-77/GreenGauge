import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '../../context/UserContext/UserContext';
import axios from 'axios';
// import './Visualization.css';

const Prediction = () => {
  const { deviceid } = useParams();
  const { id } = useUser();
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER_PATH}/fetchData`, {
          params: { userid: id, deviceid: deviceid }
        });
        setPredictions(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching predictions:", err); // log to console for debugging
        setError('Failed to fetch predictions. Not enough data rows to process.');
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [id, deviceid]);

  if (loading) return <div>Loading predictions...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="prediction-container">
      <h2>Future Predictions</h2>
      {predictions ? (
        <div>
          <p><strong>Future Avg Power:</strong> {predictions.future_avgPower} W</p>
          <p><strong>Future Time Elapsed:</strong> {predictions.future_timeElapsed} s</p>
          <p><strong>Future PC Emissions:</strong> {predictions.future_PCEmissions} kg CO2e</p>
        </div>
      ) : (
        <p>No predictions available.</p>
      )}
    </div>
  );
};

export default Prediction;
