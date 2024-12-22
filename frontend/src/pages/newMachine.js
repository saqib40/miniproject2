import React, { useState } from 'react';
import { Box, Container, TextField, Typography, Button, Paper, Stack, Alert } from '@mui/material';

const NewMachine = () => {
  const [lockName, setLockName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      const response = await fetch('http://localhost:4000/v1/new-machine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('myToken')}`
        },
        body: JSON.stringify({ name: lockName, password })
      });
      const data = await response.json();

      if (data.success) {
        setMessage('Machine created successfully');
        setIsError(false);
      } else {
        setMessage(data.message);
        setIsError(true);
      }
    } catch (error) {
      setMessage('Failed to create machine');
      setIsError(true);
    }
  };

  return (
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
        <Paper
          elevation={3}
          sx={{ padding: 4, textAlign: 'center' }}
        >
          <Typography variant="h4" component="h1" sx={{ marginBottom: 3 }}>
            New Lock
          </Typography>
          {message && (
            <Alert severity={isError ? 'error' : 'success'} sx={{ marginBottom: 3 }}>
              {message}
            </Alert>
          )}
          <Stack spacing={3}>
            <TextField
              label="Lock Name"
              variant="outlined"
              fullWidth
              value={lockName}
              onChange={(e) => setLockName(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleSubmit}
            >
              Submit
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default NewMachine;
