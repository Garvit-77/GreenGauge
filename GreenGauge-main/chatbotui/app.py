from flask import Flask, request, jsonify
from huggingface_hub import InferenceClient

app = Flask(__name__)

# Initialize the Inference Client with your Hugging Face API key
client = InferenceClient(api_key="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")

@app.route('/get_response', methods=['POST'])
def get_response():
    # Get the user message from the request
    data = request.get_json()
    user_message = data.get('message')

    if not user_message:
        return jsonify({'error': 'Message is required'}), 400

    # Prepare the messages for the Hugging Face model
    messages = [{"role": "user", "content": user_message}]
    
    # Send the message to Hugging Face API
    stream = client.chat.completions.create(
        model="microsoft/Phi-3.5-mini-instruct",
        messages=messages,
        max_tokens=500,
        stream=True
    )

    bot_response = ""
    for chunk in stream:
        bot_response += chunk.choices[0].delta.content

    return jsonify({'response': bot_response})

if __name__ == '__main__':
    # Change the port to 5001 (or any other available port)
    app.run(debug=True, port=5001)
