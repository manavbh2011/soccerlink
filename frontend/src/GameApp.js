import React, { useState, useEffect } from "react";
import axios from "axios";

const GameApp = () => {
    const [rows, setRows] = useState([{ player1: "", player2: "" }]);
    const [goal, setGoal] = useState({ start: "Player A", end: "Player B" }); // Example players
    const [suggestions1, setSuggestions1] = useState([]);
    const [message, setMessage] = useState("");

    const handleInputChange = (index, field, value) => {
        const updatedRows = [...rows];
        updatedRows[index][field] = value;
        setRows(updatedRows);
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
            const result = await response.json();
            return result.valid;
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
        if (!player1 || !player2) {
            setMessage("Both fields must be filled!");
            return;
        }

        const isValid = await validateConnection(player1, player2);
        if (isValid) {
            setMessage(`Connection between ${player1} and ${player2} is valid!`);
        } else {
            setMessage(`Connection between ${player1} and ${player2} is invalid.`);
        }
    };

    const handleAddRow = () => {
        setRows([...rows, { player1: "", player2: "" }]);
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
            <h1>Find the Connection</h1>
            <p>Goal: Connect {goal.start} to {goal.end}</p>
            {rows.map((row, index) => (
                <div>
                    <input
                        type="text"
                        placeholder="Player 1"
                        value={index === 0 ? goal.start : row.player1}
                        onChange={(e) => handleInputChange(index, "player1", e.target.value)}
                        readOnly={index === 0}
                    />
                    <input
                        type="text"
                        placeholder="Player 2"
                        value={row.player2}
                        onChange={(e) => handleInputChange(index, "player2", e.target.value)}
                    />
                    <button onClick={() => handleValidate(index)}>Validate</button>
                    {index === rows.length - 1 && (
                        <button onClick={handleAddRow}>Add Row</button>
                    )}
                    {rows.length > 1 && index!==0 && (
                    <button onClick={handleRemoveRow} style={{ marginLeft: "10px" }}>
                        Remove Row
                    </button>
                    )}
                </div>
            ))}
            <p>{message}</p>
        </div>
    );
};

export default GameApp;
