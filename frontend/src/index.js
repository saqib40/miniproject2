import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'
import Login from './pages/login.js';
import Signup from './pages/signup.js';
import NewMachine from './pages/newMachine.js';
import ExistingMachine from './pages/existingMachine.js';
import AllMachines from './pages/allMachines.js';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles'
import { createTheme } from '@mui/material'
import { WebSocketProvider } from './contexts/WebSocketContext.js';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <WebSocketProvider>  {/* Add this wrapper */}
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/existing-machine/:machineId" element={<ExistingMachine />} />
            <Route path="/new-machine" element={<NewMachine />} />
            <Route path="/all-machines" element={<AllMachines />} />
          </Routes>
        </WebSocketProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)