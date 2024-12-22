import React, { useEffect, useState } from 'react';
import { 
    Box, 
    Container, 
    Typography, 
    Paper, 
    List, 
    ListItem, 
    ListItemText, 
    IconButton, 
    Chip, 
    CircularProgress, 
    Button 
} from '@mui/material';
import { Lock, LockOpen } from '@mui/icons-material';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNavigate } from 'react-router-dom';

const AllMachines = () => {
    const [machines, setMachines] = useState([]);
    const [machineStatuses, setMachineStatuses] = useState({});  // Define the state for machine statuses
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { machineStatuses: wsMachineStatuses } = useWebSocket();  // From WebSocket context
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("myToken");
        setIsAuthenticated(token ? true : false);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchMachines();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        // Sync the WebSocket status updates with local state
        setMachineStatuses((prevStatuses) => ({
            ...prevStatuses,
            ...wsMachineStatuses
        }));
    }, [wsMachineStatuses]);  // This effect runs when WebSocket machine statuses change

    const fetchMachines = async () => {
        try {
            const response = await fetch('http://localhost:4000/v1/all-machines', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('myToken')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                const initialStatuses = data.data.reduce((acc, machine) => {
                    acc[machine._id] = machine.status || 'offline'; // Default to 'offline' if status is not set
                    return acc;
                }, {});
                setMachines(data.data);
                setMachineStatuses(initialStatuses);  // Set initial statuses
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch machines');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'locked': return 'error';
            case 'unlocked': return 'success';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <Typography variant="h6" color="error">
                    You aren't authorized to access this route. Please login.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ padding: 4 }}>
            <Container maxWidth="md">
                <Paper elevation={3} sx={{ padding: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Your Locks
                    </Typography>
                    {error && (
                        <Typography color="error" gutterBottom>
                            {error}
                        </Typography>
                    )}
                    <List>
                        {machines.map((machine) => (
                            <ListItem 
                                key={machine._id}
                                divider
                                button
                                onClick={() => navigate(`/existing-machine/${machine._id}`)}
                                sx={{
                                    '&:hover': {
                                        backgroundColor: 'action.hover'
                                    }
                                }}
                            >
                                <ListItemText
                                    primary={machine.name}
                                    secondary={
                                        <span>
                                            <Chip 
                                                label={machineStatuses[machine._id] || 'offline'}
                                                color={getStatusColor(machineStatuses[machine._id])}
                                                size="small"
                                                sx={{ mt: 1 }}
                                            />
                                        </span>
                                    }
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <IconButton 
                                        edge="end" 
                                        color={machineStatuses[machine._id] === 'locked' ? 'error' : 'success'}
                                    >
                                        {machineStatuses[machine._id] === 'locked' ? <Lock /> : <LockOpen />}
                                    </IconButton>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                    <Button variant="contained" color="primary" sx={{ mt: 3 }} onClick={() => navigate("/new-machine")}>
                        Add New Machine
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
};

export default AllMachines;
