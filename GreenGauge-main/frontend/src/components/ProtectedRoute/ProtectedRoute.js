// ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext/UserContext'; // Update the path if necessary

const ProtectedRoute = ({ children }) => {
    const { username } = useUser();
    return username ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
