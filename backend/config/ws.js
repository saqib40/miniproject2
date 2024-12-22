// config/ws.js
const WebSocket = require('ws');
const machineModel = require("../models/machine");

let wss;

const setupWebSocketServer = (server) => {
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
        console.log('New WebSocket connection');
        let machineId = null;

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);

                switch (data.type) {
                    case 'register':
                        machineId = data.machineId;
                        ws.machineId = machineId; // Store machineId in the ws object
                        await updateMachineStatus(machineId, data.status || 'locked');
                        ws.send(JSON.stringify({ type: 'registration_success', message: 'Machine registered successfully' }));
                        break;

                    case 'status_update':
                        if (machineId) {
                            await updateMachineStatus(machineId, data.status);
                        }
                        break;

                    case 'heartbeat':
                        if (machineId) {
                            await updateMachineLastSeen(machineId);
                        }
                        break;
                }
            } catch (error) {
                console.error('WebSocket message handling error:', error);
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
            }
        });

        ws.on('close', async () => {
            if (machineId) {
                await updateMachineStatus(machineId, 'offline');
                console.log(`Machine ${machineId} disconnected`);
            }
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            if (machineId) {
                // Ensure the status is updated to offline on error
                updateMachineStatus(machineId, 'offline');
            }
        });
    });

    return wss;
};

const updateMachineStatus = async (machineId, status) => {
    await machineModel.findByIdAndUpdate(machineId, { status, lastSeen: new Date() });
    // Notify all clients about the status update
    broadcastStatusUpdate(machineId, status);
};

const updateMachineLastSeen = async (machineId) => {
    await machineModel.findByIdAndUpdate(machineId, { lastSeen: new Date() });
};

const broadcastStatusUpdate = (machineId, status) => {
    // Function to broadcast status updates to all connected clients
    if (wss) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'status_update', machineId, status }));
            }
        });
    }
};

module.exports = { setupWebSocketServer, broadcastStatusUpdate };
