import React, { useState } from 'react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Function to toggle the chatbot visibility
  const toggleChat = () => setIsOpen(!isOpen);

  return (
    <div>
      {/* Chatbot Toggle Button */}
      <button
        onClick={toggleChat}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          padding: '10px 15px',
          cursor: 'pointer',
        }}
      >
        {isOpen ? 'X' : 'Chat'}
      </button>

      {/* Chatbot iframe */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '70px',
            right: '20px',
            border: '1px solid #ccc',
            backgroundColor: '#fff',
            padding: '16px',
            maxWidth: '300px',
            width: '100%',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
          }}
        >
          <iframe
            src="http://localhost:8000/chatbot" // Replace with the correct Laravel Livewire route
            style={{
              width: '100%',
              height: '600px',
              border: 'none',
              borderRadius: '10px',
            }}
            title="Chatbot"
          />
        </div>
      )}
    </div>
  );
};

export default Chatbot;
