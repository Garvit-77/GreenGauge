// Logout.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext/UserContext'; // Update the path if necessary

const Logout = () => {
    const { setUsername } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        // Clear the username from context and localStorage when this component renders
        setUsername(null);
        localStorage.removeItem('username'); // Optionally, remove username from localStorage
        navigate('/login'); // Redirect to the login page
    }, [setUsername, navigate]);

    return null; // This component doesn't need to render anything
};

export default Logout;
