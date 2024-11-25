import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_SERVER_PATH}/register`, { username, password });
      if (response.data.success) {
        alert('Registration successful! You can now log in.');
        navigate('/login'); // Redirect to the login page
      } else {
        alert('Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Error registering user:', error);
    }
  };

  return (
    <FormContainer>
      <h2>Register</h2>
      <FormGroup>
        <label>Username</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
      </FormGroup>
      <FormGroup>
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </FormGroup>
      <button onClick={handleRegister}>Register</button>
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

export default Register;
