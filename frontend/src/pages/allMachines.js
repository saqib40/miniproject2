import React from 'react';
import { Box, Container, Typography, Button, Paper, Stack, Card, CardContent, CardActions } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AllMachines = () => {
  const navigate = useNavigate();

  // Sample list of machines
  const machines = [
    { id: 1, name: 'Lock 1' },
    { id: 2, name: 'Lock 2' },
    { id: 3, name: 'Lock 3' },
    { id: 4, name: 'Lock 4' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: 4,
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={3}
          sx={{ padding: 4, textAlign: 'center', marginBottom: 3 }}
        >
          <Typography variant="h4" component="h1" sx={{ marginBottom: 3 }}>
            All Machines
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/new-machine')}
            sx={{ marginBottom: 3 }}
          >
            Add New Lock
          </Button>
        </Paper>

        <Stack
          direction="row"
          flexWrap="wrap"
          spacing={2}
          justifyContent="center"
        >
          {machines.map((machine) => (
            <Card
              key={machine.id}
              sx={{
                width: 250,
                marginBottom: 3,
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <Typography variant="h6" component="h2" sx={{ textAlign: 'center' }}>
                  {machine.name}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => navigate(`/existing-machine`)}
                  fullWidth
                >
                  View
                </Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      </Container>
    </Box>
  );
};

export default AllMachines;
