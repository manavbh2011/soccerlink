import React, { useState } from "react";
import axios from "axios";

const GameApp = () => {
    const [rows, setRows] = useState([{ player1: "", player2: "" }]);
    const [goal, setGoal] = useState({ start: "Player A", end: "Player B" }); // Example players
    const [message, setMessage] = useState("");

    const handleInputChange = (index, field, value) => {
        const updatedRows = [...rows];
        updatedRows[index][field] = value;
        setRows(updatedRows);
    };

    const validateConnection = async (player1, player2) => {
        try {
            const response = await axios.post("/api/validate-connection", {
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

    return (
        <div>
            <h1>Find the Connection</h1>
            <p>Goal: Connect {goal.start} to {goal.end}</p>
            {rows.map((row, index) => (
                <div key={index} style={{ marginBottom: "10px" }}>
                    <input
                        type="text"
                        placeholder="Player 1"
                        value={row.player1}
                        onChange={(e) => handleInputChange(index, "player1", e.target.value)}
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
                </div>
            ))}
            <p>{message}</p>
        </div>
    );
};

export default GameApp;
