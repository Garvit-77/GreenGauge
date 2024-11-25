from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
import os
from flask_cors import CORS  # Import CORS

app = Flask(__name__)

# Enable CORS for all routes and origins
CORS(app)

def train_lstm_model(data):
    """Train the LSTM model using the provided data."""
    sequence_length = 10  # Example sequence length
    features = ['avgPower', 'timeElapsed', 'PCEmissions']
    x, y = [], []

    # Check if there is enough data for the sequence length
    if len(data) < sequence_length:
        raise ValueError("Not enough data to train the model. Minimum data points required: {}".format(sequence_length))

    # Prepare data for LSTM
    for i in range(len(data) - sequence_length):
        x.append(data[features].iloc[i:i + sequence_length].values)
        y.append(data[features].iloc[i + sequence_length].values)

    x, y = np.array(x), np.array(y)

    # Define LSTM model
    model = Sequential()
    model.add(LSTM(50, activation='relu', input_shape=(sequence_length, len(features))))
    model.add(Dense(len(features)))
    model.compile(optimizer='adam', loss='mse')

    # Train the model
    model.fit(x, y, epochs=50, batch_size=32, verbose=0)
    return model

@app.route('/predict', methods=['POST'])
def predict():
    """Predict the future values using the LSTM model."""
    data = request.json.get('data')
    
    # Check if data is provided
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # Convert the incoming data to a DataFrame
    try:
        df = pd.DataFrame(data)
    except Exception as e:
        return jsonify({'error': 'Invalid data format', 'details': str(e)}), 400

    # Check if the DataFrame has enough rows for sequence length
    if len(df) < 10:
        return jsonify({'error': 'Insufficient data for prediction, need at least 10 rows'}), 400

    try:
        # Train the LSTM model on the provided data
        model = train_lstm_model(df)

        # Make future predictions using the last 10 rows of the dataset
        last_sequence = df[['avgPower', 'timeElapsed', 'PCEmissions']].tail(10).values
        future_predictions = model.predict(np.array([last_sequence]))

        # Return the prediction results
        return jsonify({
            'future_avgPower': float(future_predictions[0][0]),
            'future_timeElapsed': float(future_predictions[0][1]),
            'future_PCEmissions': abs(float(future_predictions[0][2]))
        })
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        # Log the error for debugging
        print(f"Error during prediction: {e}")
        return jsonify({'error': 'Error during prediction', 'details': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PREDMODEL_PORT', 10020))
    app.run(debug=True, port=port)
