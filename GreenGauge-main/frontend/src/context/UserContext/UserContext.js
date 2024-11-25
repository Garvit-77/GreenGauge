import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  // Retrieve stored username and id from localStorage
  const storedUsername = localStorage.getItem('username');
  const storedId = localStorage.getItem('id');
  
  // State for username and id
  const [username, setUsername] = useState(storedUsername || null);
  const [id, setId] = useState(storedId || null);

  // Update the username in both context and localStorage
  const updateUsername = (newUsername) => {
    setUsername(newUsername);
    if (newUsername) {
      localStorage.setItem('username', newUsername);
    } else {
      localStorage.removeItem('username');
    }
  };

  // Update the id in both context and localStorage
  const updateId = (newId) => {
    setId(newId);
    if (newId) {
      localStorage.setItem('id', newId);
    } else {
      localStorage.removeItem('id');
    }
  };

  // Use effect to handle setting the username and id when user is logged in
  useEffect(() => {
    if (storedUsername && storedId) {
      setUsername(storedUsername);
      setId(storedId);
    }
  }, [storedUsername, storedId]);

  return (
    <UserContext.Provider value={{ username, id, setUsername: updateUsername, setId: updateId }}>
      {children}
    </UserContext.Provider>
  );
};
