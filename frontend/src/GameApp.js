import React, { useState, useEffect } from "react";
import axios from "axios";

const GameApp = () => {
    const [goal, setGoal] = useState({ start: "Player A", end: "Player B" }); // Example players
    const [rows, setRows] = useState([{ player1: "", player2: "" }]);
    const [suggestions, setSuggestions] = useState([]);
    const [validationResults, setValidationResults] = useState([]);
    const [gameCompleted, setGameCompleted] = useState(false);

    const handleInputChange = (index, field, value) => {
        const updatedRows = [...rows];
        if (index===0) {
            updatedRows[index]["player1"] = goal.start;
        }
        updatedRows[index][field] = value;
        setRows(updatedRows);
        fetchSuggestions(value, setSuggestions);
    };
    const setPlayers = async () => {
        try {
            const response = await axios.get("http://127.0.0.1:3001/api/get-random-players");
            if (response.data && response.data.start && response.data.end) {
                setGoal({ start: response.data.start, end: response.data.end });
            } else {
                console.error("Invalid response format:", response.data);
            }
          } catch (error) {
            console.error("Error fetching random players:", error);
          }
    }
    useEffect(() => {
        setPlayers();
      }, []);
    const validateConnection = async (player1, player2) => {
        try {
            const response = await axios.post("http://127.0.0.1:3001/api/validate-connection", {
                input1: player1,
                input2: player2
            });
            return response.data.valid;
        } catch (error) {
            console.error("Error validating connection:", error);
            return false;
        }
    };
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
    const handleValidate = async (index) => {
        const { player1, player2 } = rows[index];
        console.log(rows[index]);
        if (!player1 || !player2) {
            console.error("Both fields must be filled!");
            return;
        }

        const isValid = await validateConnection(player1, player2);
        const updatedResults = [...validationResults];
        updatedResults[index] = isValid;
        setValidationResults(updatedResults);
        if (isValid && player2 === goal.end) {
            setGameCompleted(true);
        }
    };
    const handleSuggestionClick = (name, setInput, setSuggestions) => {
        setInput(name);
        setSuggestions([]);
      };
    const handleAddRow = () => {
        const previousRow = rows[rows.length - 1];
        const newRow = { player1: previousRow.player2, player2: "" };
        setRows([...rows, newRow]);
        setValidationResults([...validationResults, null]);
    };

    const handleRemoveRow = () => {
        if (rows.length > 1) {
          const updatedRows = [...rows];
          updatedRows.pop(); // Remove the last row
          setRows(updatedRows);
        }
      };
    return (
        <div>
            <header><h1 className="title" aria-label="Title: Link the Players">Link the Players</h1></header>
            <p className="subheading" aria-label="Game instructions">Goal: Connect {goal.start} to {goal.end}</p>
            {rows.map((row, index) => (
                <div>
                    <input
                        type="text"
                        placeholder="Player 1"
                        value={index === 0 ? goal.start : row.player1}
                        onChange={(e) => handleInputChange(index, "player1", e.target.value)}
                        readOnly={index === 0}
                        disabled = {gameCompleted}
                    />
                    <input
                        type="text"
                        placeholder="Player 2"
                        value={row.player2}
                        onChange={(e) => handleInputChange(index, "player2", e.target.value)}
                        disabled = {gameCompleted}
                    />
                    {!gameCompleted && (
                        <>
                        <button onClick={() => handleValidate(index)}>Validate</button>
                        {index === rows.length - 1 && (
                            <button 
                            type="submit"
                            onClick={handleAddRow}
                            className="validate-button"
                            disabled={!validationResults[index]}
                            >
                            Add Row
                            </button>
                        )}
                        {rows.length > 1 && index!==0 && (
                        <button onClick={handleRemoveRow} style={{ marginLeft: "10px" }}>
                            Remove Row
                        </button>
                        )}
                        </>
                    )}
                </div>
            ))}
            {gameCompleted && (
                <div className = "win-message">
                Congratulations! You found the link between {goal.start} and {goal.end}.
                </div>
            )}
        </div>
    );
};

export default GameApp;
