<?php

namespace App\Livewire;

use Livewire\Component;
use Illuminate\Support\Facades\Http;

class Chatbot extends Component
{
    public $messages = [];  // Initialize with an empty array
    public $newMessage = ''; // User's new message

    public function sendMessage()
    {
        // Validate that the message is not empty
        if (empty(trim($this->newMessage))) {
            return;
        }

        // Add the user's message to the conversation history
        $this->messages[] = [
            'content' => $this->newMessage,
            'sender' => 'user',
        ];

        $userMessage = $this->newMessage;

        // Reset the input field
        $this->newMessage = '';

        // Send the user's message to the Python backend and get the response
        $botResponse = $this->sendToPythonBackend($userMessage);

        // Add the bot's response to the conversation
        $this->messages[] = [
            'content' => $botResponse,
            'sender' => 'bot',
        ];
    }

    // Method to send the user's message to the Python backend and get the bot's response
    private function sendToPythonBackend($message)
    {
        // Send a POST request to the Python server (update the port to 5001)
        $response = Http::post('http://127.0.0.1:5001/get_response', [
            'message' => $message, // Send the user's message
        ]);

        // Check if the response is successful and return the bot's response
        if ($response->successful()) {
            $data = $response->json();
            return $data['response'] ?? 'Sorry, I could not understand that.';
        }

        // Return a fallback message if the response is unsuccessful
        return 'Sorry, there was an error connecting to the bot.';
    }

    public function render()
    {
        return view('livewire.chatbot');
    }
}
