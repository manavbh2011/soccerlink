import React, { useState } from "react";
import axios from "axios";
import './App.css';

function App() {
  const [input1, setInput1] = useState("");
  const [input2, setInput2] = useState("");
  const [result, setResult] = useState([]);
  const [error, setError] = useState(null)
  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("Form submitted!");
    try {
      const response = await axios.post("http://127.0.0.1:3001/api/find-connections", {
        input1: input1,
        input2: input2
      });
      console.log(response.data);
      if (!response.data.result) {
        setError("One or both player names were typed incorrectly or not found in the database.");
        setResult([]);
      } else {
        setResult(response.data.result);
        setError([]);
        } // Update result from the server response
    } catch (error) {
      setError(`An error occurred: ${error.message}`);
      setResult([]);

    }
  };
  return (
    <div className="App">
      <header><h1 className="title" aria-label="Title: SoccerLink">SoccerLink</h1></header>
      <form className="form-container" onSubmit={handleSubmit}>
        <div className="input-container">
        <label htmlFor="player1" className="input-label">Player 1:</label>
        <input
            type="text"
            id="player1"
            value={input1}
            onChange={(e) => setInput1(e.target.value)}
            className="input-box"
            aria-labelledby="player1"
        />
        </div>
        
        <div className="input-container">
        <label htmlFor="player2" className="input-label">Player 2:</label>
        <input
            type="text"
            id="player2"
            value={input2}
            onChange={(e) => setInput2(e.target.value)}
            className="input-box"
            aria-labelledby="player2"
        />
        </div>
        
        <button 
        type="submit" 
        className="submit-button"
        disabled={input1 === "" || input2 === ""}
        >
        Find Connections
        </button>
      </form>
      {error && <div className="error-message">{error}</div>}
      <div className="results">
        {result.map((line, index) => (
            <p key={index} className="result-line">
            {`${line.from} and ${line.to} played on ${line.teams}`}
            </p>
        ))}
        </div>
    </div>
  );
}

export default App;