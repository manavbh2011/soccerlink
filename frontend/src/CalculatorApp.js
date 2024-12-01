import React, { useState } from 'react';
import axios from 'axios';

function App() {
    // Define state for input values and the sum
    const [num1, setNum1] = useState('');
    const [num2, setNum2] = useState('');
    const [sum, setSum] = useState(null);
    const [error, setError] = useState('');

    // Function to handle the sum calculation
    const calculateSum = async () => {
        // Clear previous error if any
        setError('');

        // Validate input to ensure they're valid numbers
        if (isNaN(num1) || isNaN(num2)) {
            setError('Please enter valid numbers.');
            return;
        }

        try {
            // Make the POST request to the Flask backend with the two numbers
            const response = await axios.post('http://127.0.0.1:3001/api/sum', {
                num1: parseFloat(num1),
                num2: parseFloat(num2)
            });
            
            // Update the sum state with the result from the backend
            setSum(response.data.sum);
        } catch (error) {
            setError('There was an error calculating the sum. Please try again.');
        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Sum Calculator</h1>

            {/* Input fields for numbers */}
            <input
                type="number"
                placeholder="Enter first number"
                value={num1}
                onChange={(e) => setNum1(e.target.value)}
            />
            <input
                type="number"
                placeholder="Enter second number"
                value={num2}
                onChange={(e) => setNum2(e.target.value)}
            />

            {/* Button to trigger sum calculation */}
            <button onClick={calculateSum}>Calculate Sum</button>

            {/* Display error message if input is invalid */}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {/* Display the sum result */}
            {sum !== null && !error && (
                <div>
                    <h2>Sum: {sum}</h2>
                </div>
            )}
        </div>
    );
}

export default App;
