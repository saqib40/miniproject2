// config/ws.js
const WebSocket = require('ws');
const machineModel = require("../models/machine");

let wss;

const setupWebSocketServer = (server) => {
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
        console.log('New WebSocket connection');
        let machineId = null;
        let role = null;

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                
                // Handle registration differently for machines vs clients
                if (data.type === 'register') {
                    role = data.role; // 'machine' or 'client'
                    ws.role = role; // Store role in ws object
                    
                    if (role === 'machine') {
                        machineId = data.machineId;
                        ws.machineId = machineId;
                        // When machine connects, ensure it starts in locked state
                        await updateMachineStatus(machineId, 'locked');
                        ws.send(JSON.stringify({ 
                            type: 'registration_success', 
                            message: 'Machine registered successfully' 
                        }));
                    } else if (role === 'client') {
                        // Client registration - might want to store client info
                        ws.send(JSON.stringify({ 
                            type: 'registration_success', 
                            message: 'Client registered successfully' 
                        }));
                    }
                    return;
                }

                // Handle other message types based on role
                if (role === 'machine') {
                    switch (data.type) {
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
                }
                // Client-specific message handling can be added here if needed
                // have to add 
                
            } catch (error) {
                console.error('WebSocket message handling error:', error);
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
            }
        });

        ws.on('close', async () => {
            if (role === 'machine' && machineId) {
                await updateMachineStatus(machineId, 'offline');
                console.log(`Machine ${machineId} disconnected`);
            }
        });

        ws.on('error', async (error) => {
            console.error('WebSocket error:', error);
            if (role === 'machine' && machineId) {
                await updateMachineStatus(machineId, 'offline');
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
