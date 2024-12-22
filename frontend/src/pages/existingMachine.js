import React, { useState, useEffect } from 'react';
import { 
    Box, Container, TextField, Typography, Button, Paper, 
    Stack, CircularProgress, Alert, Snackbar 
} from '@mui/material';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useParams } from 'react-router-dom';

const ExistingMachine = () => {
    const { machineId } = useParams();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [localStatus, setLocalStatus] = useState('offline');  // Add local status
    const { machineStatuses, sendCommand, isConnected } = useWebSocket();

    // Fetch initial machine status
    useEffect(() => {
        const fetchMachineStatus = async () => {
            try {
                const response = await fetch(`http://localhost:4000/v1/all-machines`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('myToken')}`
                    }
                });
                const data = await response.json();
                
                if (data.success) {
                    const machine = data.data.find(m => m._id === machineId);
                    if (machine) {
                        setLocalStatus(machine.status || 'offline');
                    }
                }
            } catch (err) {
                console.error('Error fetching machine status:', err);
            }
        };

        fetchMachineStatus();
    }, [machineId]);

    // Combine WebSocket status with local status
    const status = machineStatuses[machineId] || localStatus;

    useEffect(() => {
        console.log('Current machine status:', status);
        console.log('WebSocket connected:', isConnected);
        console.log('Machine ID:', machineId);
    }, [status, isConnected, machineId]);

    const handleToggleLock = async () => {
        if (!password) {
            setError('Password is required');
            return;
        }
    
        setLoading(true);
        setError('');
        setSuccessMessage('');
    
        try {
            const command = status === 'locked' ? 'unlock' : 'lock';
            const success = await sendCommand(machineId, command, password);
            
            if (success) {
                setSuccessMessage(`Successfully sent ${command} command`);
                setPassword(''); // Clear the password field after successful command
                // Don't update local status here - wait for WebSocket update
            } else {
                setError('Command failed to execute');
            }
        } catch (err) {
            setError(err.message || 'Failed to toggle lock');
        } finally {
            setLoading(false);
        }
    };

    // Rest of the component remains the same...
    return (
        // ... existing JSX ...
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                padding: 4,
            }}
        >
            <Container maxWidth="sm">
                <Paper elevation={3} sx={{ padding: 4, textAlign: 'center' }}>
                    <Typography variant="h4" component="h1" sx={{ marginBottom: 3 }}>
                        Lock Control
                    </Typography>

                    {/* Add debug info */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                            Connection Status: {isConnected ? 'Connected' : 'Disconnected'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Lock Status: {status}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Machine ID: {machineId}
                        </Typography>
                    </Box>

                    {!isConnected && (
                        <Alert severity="warning" sx={{ marginBottom: 2 }}>
                            Not connected to server. Attempting to reconnect...
                        </Alert>
                    )}

                    <Stack spacing={3}>
                        <TextField
                            label="Status"
                            variant="outlined"
                            fullWidth
                            value={status.charAt(0).toUpperCase() + status.slice(1)}
                            InputProps={{
                                readOnly: true,
                                sx: {
                                    color: status === 'locked' ? 'error.main' : 
                                           status === 'unlocked' ? 'success.main' : 'text.secondary'
                                }
                            }}
                        />
                        <TextField
                            label="Password"
                            type="password"
                            variant="outlined"
                            fullWidth
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={!!error}
                            helperText={error}
                        />
                        <Button
                            variant="contained"
                            color={status === 'locked' ? 'success' : 'error'}
                            size="large"
                            onClick={handleToggleLock}
                            disabled={loading || status === 'offline' || !isConnected}
                            startIcon={loading && <CircularProgress size={20} color="inherit" />}
                        >
                            {status === 'locked' ? 'Unlock' : 'Lock'}
                        </Button>
                    </Stack>

                    <Snackbar
                        open={!!successMessage}
                        autoHideDuration={6000}
                        onClose={() => setSuccessMessage('')}
                        message={successMessage}
                    />
                </Paper>
            </Container>
        </Box>
    );
};

export default ExistingMachine;