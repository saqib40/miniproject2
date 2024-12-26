import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [machineStatuses, setMachineStatuses] = useState({});
    const [isConnected, setIsConnected] = useState(false);

    const connectWebSocket = useCallback(() => {
        console.log('Attempting to connect to WebSocket...');
        const ws = new WebSocket('ws://localhost:4000');

        ws.onopen = () => {
            console.log('Connected to WebSocket server');
            setIsConnected(true);
            // Register as a client
            ws.send(JSON.stringify({
                type: 'register',
                role: 'client'
            }));
            // Log the current machine statuses
            console.log('Current machine statuses:', machineStatuses);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WebSocket message received:', data);

                switch (data.type) {
                    case 'status_update':
                        console.log('Updating status for machine:', data.machineId, 'to:', data.status);
                        setMachineStatuses(prev => ({
                            ...prev,
                            [data.machineId]: data.status
                        }));
                        break;
                    case 'error':
                        console.error('WebSocket error message:', data.message);
                        break;
                    default:
                        console.log('Unknown message type:', data.type);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onclose = (event) => {
            console.log('WebSocket closed. Code:', event.code, 'Reason:', event.reason);
            setIsConnected(false);
            // Attempt to reconnect after 5 seconds
            setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
        };

        setSocket(ws);
    }, []);

    useEffect(() => {
        connectWebSocket();
        return () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
        };
    }, [connectWebSocket]);

    const sendCommand = async (machineId, command, password) => {
        try {
            console.log('Sending command:', command, 'to machine:', machineId);
            const response = await fetch(`http://localhost:4000/v1/existing-machine/${machineId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('myToken')}`
                },
                body: JSON.stringify({ command, password })
            });
    
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to send command');
            }
    
            const data = await response.json();
            console.log('Command response:', data);
            return data.success;
        } catch (error) {
            console.error('Error sending command:', error);
            throw error;
        }
    };

    return (
        <WebSocketContext.Provider value={{ 
            socket, 
            machineStatuses, 
            sendCommand, 
            isConnected,
            connectionStatus: isConnected ? 'connected' : 'disconnected' // Added for debugging
        }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);