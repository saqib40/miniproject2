import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  useTheme
} from '@mui/material';

const App = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(to bottom right, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={3}
          sx={{
            padding: 6,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Brand Section */}
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 'bold',
              color: theme.palette.primary.dark,
              marginBottom: 3,
            }}
          >
            Smart Lock System
          </Typography>

          {/* Tagline Section */}
          <Typography
            variant="h5"
            sx={{
              color: theme.palette.text.secondary,
              marginBottom: 6,
              maxWidth: '800px',
              margin: '0 auto',
            }}
          >
            Unlocking the Future: Because Who Needs Keys When You Have Wi-Fi and an ESP32?
          </Typography>

          {/* Buttons Section */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mt: 4 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                minWidth: 200,
                fontSize: '1.1rem',
                py: 1.5,
              }}
            >
              Login
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/signup')}
              sx={{
                minWidth: 200,
                fontSize: '1.1rem',
                py: 1.5,
              }}
            >
              Sign Up
            </Button>
          </Stack>

          {/* Footer Section */}
          <Typography
            variant="subtitle1"
            sx={{
              mt: 6,
              color: theme.palette.text.secondary,
            }}
          >
            Secure • Smart • Simple
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default App;