import React from 'react';
import logo from './logo.svg';
import './App.css';
import { ThemeProvider, CssBaseline } from '@mui/material';
import darkTheme from './theme';
import CameraRecorder from './CameraRecorder';
import { ToastContainer } from 'react-toastify';

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline /> {/* Ensures consistent background and text colors */}
      <ToastContainer />
      <CameraRecorder />
    </ThemeProvider>
  );
}

export default App;
