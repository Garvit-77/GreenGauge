<div class="chatbot" style="border: 1px solid #ccc; padding: 16px; max-width: 400px; margin: auto;">
    <!-- Messages Section -->
    <div class="messages" style="height: 300px; overflow-y: scroll; margin-bottom: 16px;" id="messages-container">
        @foreach ($messages as $message)
            <div class="{{ $message['sender'] }}" style="background-color: {{ $message['sender'] == 'user' ? '#e0e0e0' : '#d0f0c0' }}; padding: 8px; margin-bottom: 4px;">
                <p>{{ $message['content'] }}</p>
            </div>
        @endforeach
    </div>

    <!-- Input Area -->
    <div class="input-area" style="display: flex; flex-direction: column;">
        <textarea wire:model="newMessage" style="margin-bottom: 8px; padding: 8px;" placeholder="Type your message..." rows="3"></textarea>
        <button wire:click="sendMessage" style="padding: 8px; background-color: #007bff; color: white; border: none; cursor: pointer;">
            Send
        </button>
    </div>
</div>

@push('scripts')
    <script>
        // Auto-scroll to the bottom when a new message is added
        document.addEventListener('livewire:load', function () {
            const messagesContainer = document.getElementById('messages-container');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        });

        // For dynamic scrolling after a new message is added
        Livewire.on('messageAdded', () => {
            const messagesContainer = document.getElementById('messages-container');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        });
    </script>
@endpush
