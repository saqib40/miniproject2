import React, { useState } from 'react';
import { Box, Container, TextField, Typography, Button, Paper, Stack } from '@mui/material';

const NewMachine = () => {
  const [lockName, setLockName] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    // Handle submit logic here
    console.log(`Lock Name: ${lockName}, Password: ${password}`);
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
