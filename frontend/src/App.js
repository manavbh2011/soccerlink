import React, { useState} from "react";
import axios from "axios";
import './App.css';
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import GraphBackground from "./GraphBackground";
import GameApp from "./GameApp.js";
import CustomFlag from "./CustomFlag";

function App() {
  const [input1, setInput1] = useState("");
  const [input2, setInput2] = useState("");
  const [result, setResult] = useState([]);
  const [error, setError] = useState(null)
  const [suggestions1, setSuggestions1] = useState([]);
  const [suggestions2, setSuggestions2] = useState([]);
  const [showBackground, setShowBackground] = useState(false);
  const [showFlag, setShowFlag] = useState(false);

  const fetchSuggestions = async (input, setSuggestions) => {
    if (input.trim() === "") {
      setSuggestions([]);
      return;
    }
    try {
      const response = await axios.post("http://127.0.0.1:3001/api/suggest-players", {
        query: input
      });
      setSuggestions(response.data);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("Form submitted!");
    setSuggestions1([]);
    setSuggestions2([]);
    try {
      const response = await axios.post("http://127.0.0.1:3001/api/find-connections", {
        input1: input1,
        input2: input2
      });
      if (input1.trim()===input2.trim()) {
        setError("Enter two different players");
        setResult([]);
        console.log("check")
      }
      else {
        console.log(response.data);
        if (!response.data.result) {
            setError("One or both player names were typed incorrectly or not found in the database.");
            setResult([]);
        }
        else if ("error" in response.data.result) {
            setError(`No connections exist between ${input1} and ${input2}`);
            setResult([]);
        }
        else {
            const updatedResult = await Promise.all(response.data.result.map(async (line) => {
                const countryCodeFrom = await getCountryCode(line.from);
                const countryCodeTo = await getCountryCode(line.to);
                
                return {
                    ...line,
                    countryCodeFrom,
                    countryCodeTo
                };
                }));
            setResult(updatedResult);
            setError([]);
            } // Update result from the server response
        }
    } catch (error) {
      setError(`An error occurred: ${error.message}`);
      setResult([]);

    }
  };
  const getCountryCode = async (playerName) => {
    try {
      const response = await axios.post("http://127.0.0.1:3001/api/get-nationality", { playerName });
      return response.data.countryCode; // Assume response contains country code
    } catch (error) {
      console.error(`Error fetching country code for ${playerName}:`, error);
      return ""; // Fallback in case of an error
    }
  };
  const handleInputChange = (e, setInput, setSuggestions) => {
    const value = e.target.value;
    setInput(value);
    fetchSuggestions(value, setSuggestions);
  };

  const handleSuggestionClick = (name, setInput, setSuggestions) => {
    setInput(name);
    setSuggestions([]);
  };

  const toggleBackground = () => {
    setShowBackground(!showBackground);
  };
  const toggleFlag = () => {
    setShowFlag(!showFlag);
  };
  return (
    <Router>
    <div className="App">
      <div style={{ position: "absolute", top: 10, right: 19 }}>
        <label>
          <input
            type="checkbox"
            checked={showBackground}
            onChange={toggleBackground}
          />
          Enable Background
        </label>
        </div>
      {showBackground && <GraphBackground />}
      <nav className="nav-container">
        <Link to="/" className="nav-item">Home</Link>
        <Link to="/game" className="nav-item">Game</Link>
      </nav>
      <Routes>
      <Route
            path="/"
            element={
            <div>
                <div style={{ position: "absolute", top: 50, right: 10}}>
                    <label>
                    <input
                        type="checkbox"
                        checked={showFlag}
                        onChange={toggleFlag}
                    />
                    Show flags in results
                    </label>
                </div>
                <header><h1 className="title" aria-label="Title: SoccerLink">SoccerLink</h1></header>
                <p className="subheading" aria-label="Subheading: how to use SoccerLink">
                Enter the names of two soccer players to find their connections through their club teammates.</p>
                <form className="form-container" onSubmit={handleSubmit}>
                    <div className="input-container">
                    {/*<label htmlFor="player1" className="input-label">Player 1:</label>*/}
                    <input
                        type="text"
                        id="player1"
                        placeholder="Player 1"
                        value={input1}
                        onChange={(e) => handleInputChange(e, setInput1, setSuggestions1)}
                        className="input-box"
                        aria-labelledby="player1"
                    />
                    {suggestions1.length > 0 && (
                        <ul className="suggestions-list">
                        {suggestions1.map(([name, countryCode], index) => (
                            <li
                            key={index}
                            className="suggestion-item"
                            onClick={() => handleSuggestionClick(name, setInput1, setSuggestions1)}
                            >
                            <CustomFlag code={countryCode} className="custom-flag" />
                            {name}
                            </li>
                        ))}
                        </ul>
                    )}
                    </div>
                    
                    <div className="input-container">
                    {/*<label htmlFor="player2" className="input-label">Player 2:</label>*/}
                    <input
                        type="text"
                        id="player2"
                        placeholder="Player 2"
                        value={input2}
                        onChange={(e) => handleInputChange(e, setInput2, setSuggestions2)}
                        className="input-box"
                        aria-labelledby="player2"
                    />
                    {suggestions2.length > 0 && (
                        <ul className="suggestions-list">
                        {suggestions2.map(([name, countryCode], index) => (
                            <li
                            key={index}
                            className="suggestion-item"
                            onClick={() => handleSuggestionClick(name, setInput2, setSuggestions2)}
                            >
                            {name}
                            <CustomFlag code={countryCode} className="custom-flag" />
                            </li>
                        ))}
                        </ul>
                    )}
                    </div>
                    <div className="button-container">
                    <button 
                    type="submit" 
                    className="submit-button"
                    disabled={input1 === "" || input2 === ""}
                    >
                    Find Connections
                    </button></div>
                </form>
                <section>
                {error && <div className="error-message">{error}</div>}
                <div className="results">
                    {result.map((line, index) => (
                        <p key={index} className="result-line">
                        <span className="player-name">
                            {line.from} {showFlag && <CustomFlag code={line.countryCodeFrom} className="custom-flag-result" />}
                        </span>
                        {" and "}
                        <span className="player-name">
                            {line.to} {showFlag && <CustomFlag code={line.countryCodeTo} className="custom-flag-result" />}
                        </span>
                        {" played together on "}
                        <span className="team-name">{line.teams}</span>
                        </p>
                    ))}
                    </div></section>
                    </div>
                }
    />
    <Route path="/game" element={<GameApp />} />
    </Routes>
    </div>
    </Router>
  );
}

export default App;