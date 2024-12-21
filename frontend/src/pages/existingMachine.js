import React, { useState } from 'react';
import { Box, Container, TextField, Typography, Button, Paper, Stack } from '@mui/material';

const ExistingMachine = () => {
  const [status, setStatus] = useState('Locked');
  const [password, setPassword] = useState('');

  const handleUnlock = () => {
    // Handle unlock logic here
    if (password === 'correct_password') { // Replace with actual password logic
      setStatus('Unlocked');
    } else {
      alert('Incorrect password');
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
            Existing Lock
          </Typography>
          <Stack spacing={3}>
            <TextField
              label="Status"
              variant="outlined"
              fullWidth
              value={status}
              InputProps={{
                readOnly: true,
              }}
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
              onClick={handleUnlock}
            >
              Unlock
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default ExistingMachine;
