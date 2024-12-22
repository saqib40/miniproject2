const machineModel = require("../models/machine");
const bcrypt = require("bcrypt");
const { broadcastStatusUpdate } = require('../config/ws');
const WebSocket = require('ws');

let wss;

// Simplified setWebSocketServer - only stores the instance
const setWebSocketServer = (webSocketServer) => {
    wss = webSocketServer;
};

const sendCommandToMachine = async (machineId, command) => {
    if (!wss) {
        throw new Error('WebSocket server not initialized');
    }
    
    // Debug information
    console.log('Attempting to send command to machine:', machineId);
    console.log('Command:', command);
    console.log('Connected clients:', Array.from(wss.clients).map(client => ({
        machineId: client.machineId,
        readyState: client.readyState,
        connectionState: client.readyState === WebSocket.OPEN ? 'OPEN' : 'CLOSED'
    })));
    
    for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN && client.machineId === machineId) {
            console.log('Found matching client, sending command...');
            client.send(JSON.stringify({ type: 'command', command }));
            return;
        }
    }
    
    console.log('No matching client found for machineId:', machineId);
    throw new Error('Machine is not connected');
};

async function existing(req, res) {
    try {
        const { machineId } = req.params;
        const { password, command } = req.body;
        
        console.log('Received command request:', { machineId, command });
        
        if (!command || !['lock', 'unlock'].includes(command)) {
            return res.status(400).json({
                success: false,
                message: "Invalid command. Use 'lock' or 'unlock'"
            });
        }

        const machine = await machineModel.findById(machineId);
        
        if (!machine) {
            console.log('Machine not found:', machineId);
            return res.status(404).json({
                success: false,
                message: 'Machine not found'
            });
        }

        if (!await bcrypt.compare(password, machine.password)) {
            console.log('Invalid password for machine:', machineId);
            return res.status(401).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        try {
            await sendCommandToMachine(machine._id.toString(), command);

            // Update the machine's status in the database
            machine.status = command === 'lock' ? 'locked' : 'unlocked';
            machine.lastSeen = new Date();
            await machine.save();
            
            console.log('Command executed successfully for machine:', machineId);

            res.status(200).json({
                success: true,
                message: 'Command sent successfully'
            });
        } catch (error) {
            console.log('Error sending command:', error.message);
            res.status(503).json({
                success: false,
                message: 'Machine is not connected'
            });
        }
    } catch (error) {
        console.error('Internal server error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

module.exports = { existing, setWebSocketServer };