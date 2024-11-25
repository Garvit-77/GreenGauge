import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext/UserContext';
import axios from 'axios';
import './Leaderboard.css';

const Leaderboard = () => {
    const navigate = useNavigate();
    const { deviceid } = useParams();
    const { username, id } = useUser(); // Get current user's id

    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Inline style for highlighting the current user
    const highlightStyle = {
        backgroundColor: 'lightblue', // Customize color
        fontWeight: 'bold',
        border: '2px solid blue',
    };

    // Fetch all user IDs and their corresponding manufacturing emissions data
    useEffect(() => {
        const fetchUserIds = async () => {
            try {
                // Fetch all user IDs along with their usernames
                const userIdsResponse = await axios.get(`${process.env.REACT_APP_SERVER_PATH}/fetchUserIds`);
                const users = userIdsResponse.data;

                console.log('Fetched users:', users);

                // Fetch manufacturing emissions data for each user
                const allUserData = [];
                for (let user of users) {
                    const emissionsResponse = await axios.get(`${process.env.REACT_APP_SERVER_PATH}/fetchManufacturingViz`, {
                        params: { userid: user.id }
                    });

                    // Calculate the total emissions for each user
                    const totalEmissions = emissionsResponse.data.reduce((total, device) => total + device.MFEmissions, 0);

                    allUserData.push({ 
                        userid: user.id, 
                        username: user.username, 
                        totalEmissions: totalEmissions // Store the total emissions
                    });
                }

                // Sort the users by total emissions in ascending order
                allUserData.sort((a, b) => a.totalEmissions - b.totalEmissions);

                // Update state with sorted data
                setLeaderboardData(allUserData);
                setLoading(false);
            } catch (err) {
                setError('Failed to load leaderboard data');
                setLoading(false);
            }
        };

        fetchUserIds();
    }, []);

    if (loading) {
        return <div>Loading leaderboard...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="leaderboard-container">
            <h2>Leaderboard</h2>
            <div className="leaderboard-list">
                {leaderboardData.length > 0 ? (
                    <div className="leaderboard">
                        {leaderboardData.map((userData, index) => {
                            console.log('Rendering userData:', userData); // Log full data
                            console.log("Current user's ID from context:", id);  // Debug log

                            const isCurrentUser = String(userData.userid) === String(id);

                            // Log comparison result
                            console.log("Comparing userData.userid:", userData.userid, "with id:", id);
                            console.log("Is current user:", isCurrentUser);

                            return (
                                <div 
                                    key={userData.userid}
                                    style={isCurrentUser ? highlightStyle : {}} // Apply the style if it's the current user
                                >
                                    <span className="rank">{index + 1}</span>
                                    <h4>{userData.username} (User ID: {userData.userid})</h4>
                                    <p><strong>Total Manufacturing Emissions:</strong> {userData.totalEmissions} kg CO2e</p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p>No leaderboard data available.</p>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
