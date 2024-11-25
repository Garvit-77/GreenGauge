import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import { useUser } from '../../context/UserContext/UserContext';
import styled from 'styled-components';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { setUsername: setUser, setId: setUserId } = useUser(); // Destructure setId from context

    const handleLogin = async () => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_SERVER_PATH}/login`, { username, password });
            
            console.log('Login response:', response.data); // Debugging line to log response
    
            if (response.data.success) {
                const { id } = response.data.user; // Assuming the API response contains the user id
                console.log('User ID received:', id);  // Debugging line to check if ID is received
    
                setUser(username);  // Set the username in context
                setUserId(id);      // Set the id in context
    
                navigate('/'); // Navigate to home page after successful login
            } else {
                alert('Invalid username or password');
            }
        } catch (error) {
            console.error('Error logging in:', error);
        }
    };
    

    return (
        <FormContainer>
            <h2>Login</h2>
            <FormGroup>
                <label>Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
            </FormGroup>
            <FormGroup>
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </FormGroup>
            <button onClick={handleLogin}>Login</button>
        </FormContainer>
    );
};

const FormContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 50px;
`;

const FormGroup = styled.div`
    margin-bottom: 20px;
`;

export default Login;
