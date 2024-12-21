const WebSocket = require('ws');
const machineModel = require("../models/machine");

// Store active connections
const connections = new Map();

const setupWebSocketServer = (server) => {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
        console.log('New WebSocket connection');
        let machineId = null;

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                
                switch (data.type) {
                    case 'register':
                        machineId = data.machineId;
                        connections.set(machineId, {
                            ws,
                            heartbeat: Date.now(),
                            status: data.status || 'locked'
                        });
                        
                        await machineModel.findByIdAndUpdate(machineId, {
                            status: data.status || 'locked',
                            lastSeen: new Date()
                        });

                        ws.send(JSON.stringify({
                            type: 'registration_success',
                            message: 'Machine registered successfully'
                        }));
                        break;

                    case 'status_update':
                        if (machineId && connections.has(machineId)) {
                            const newStatus = data.status;
                            connections.get(machineId).status = newStatus;
                            
                            await machineModel.findByIdAndUpdate(machineId, {
                                status: newStatus,
                                lastSeen: new Date()
                            });
                        }
                        break;

                    case 'heartbeat':
                        if (machineId && connections.has(machineId)) {
                            connections.get(machineId).heartbeat = Date.now();
                            await machineModel.findByIdAndUpdate(machineId, {
                                lastSeen: new Date()
                            });
                        }
                        break;
                }
            } catch (error) {
                console.error('WebSocket message handling error:', error);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid message format'
                }));
            }
        });

        ws.on('close', async () => {
            if (machineId) {
                connections.delete(machineId);
                await machineModel.findByIdAndUpdate(machineId, {
                    status: 'offline',
                    lastSeen: new Date()
                });
                console.log(`Machine ${machineId} disconnected`);
            }
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            if (machineId) {
                connections.delete(machineId);
            }
        });
    });

    // Cleanup inactive connections
    setInterval(() => {
        const now = Date.now();
        connections.forEach(async (connection, machineId) => {
            if (now - connection.heartbeat > 30000) {
                connection.ws.terminate();
                connections.delete(machineId);
                await machineModel.findByIdAndUpdate(machineId, {
                    status: 'offline',
                    lastSeen: new Date()
                });
                console.log(`Machine ${machineId} timed out`);
            }
        });
    }, 10000);

    return wss;
};

const sendCommandToMachine = async (machineId, command) => {
    const connection = connections.get(machineId);
    if (!connection) {
        throw new Error('Machine not connected');
    }

    connection.ws.send(JSON.stringify({
        type: 'command',
        command: command
    }));
};

module.exports = {
    setupWebSocketServer,
    sendCommandToMachine
};