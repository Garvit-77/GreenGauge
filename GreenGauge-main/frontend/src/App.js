// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';  // Import the Login page
import Register from './pages/Register/Register';
import Logout from './components/Logout/Logout';
import Dashboard from './pages/Dashboard/Dashboard';
import Navbar from './components/Navbar/Navbar';
import AddDevicePage from './pages/AddDevicePage/AddDevicePage';
import DeviceInfo from './pages/DeviceInfo/DeviceInfo';
import { UserProvider } from './context/UserContext/UserContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Visualization from './pages/Visualization/Visualization';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import Prediction from './pages/Prediction/Prediction';
import Chatbot from './components/Chatbot/Chatbot'; 

const AppContent = () => {
  return (
    <>
    <Navbar/>
    <Chatbot />
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Home />} />
      <Route path="/logout" element={<ProtectedRoute><Logout /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/add-device" element={<ProtectedRoute><AddDevicePage /></ProtectedRoute>} />
      <Route path="/device-info/:deviceid" element={<ProtectedRoute><DeviceInfo /></ProtectedRoute>} />
      <Route path="/visualization/:deviceid" element={<ProtectedRoute><Visualization /></ProtectedRoute>} />
      <Route path="/prediction/:deviceid" element={<ProtectedRoute><Prediction /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      {/* Add more protected routes as needed */}
    </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </Router>
  );
}

export default App;
