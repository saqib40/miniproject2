// contexts/WebSocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [machineStatuses, setMachineStatuses] = useState({});

    useEffect(() => {
        // Create WebSocket connection
        const ws = new WebSocket('ws://your-server-url');

        ws.onopen = () => {
            console.log('Connected to WebSocket server');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'status_update') {
                setMachineStatuses(prev => ({
                    ...prev,
                    [data.machineId]: data.status
                }));
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from WebSocket server');
            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
                setSocket(null);
            }, 5000);
        };

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, []);

    const sendCommand = (machineId, command) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'command',
                machineId,
                command
            }));
        }
    };

    return (
        <WebSocketContext.Provider value={{ socket, machineStatuses, sendCommand }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);