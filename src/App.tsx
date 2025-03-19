import React from 'react';
import logo from './logo.svg';
import './App.css';
import CameraRecorder from './CameraRecorder';
import { ToastContainer } from 'react-toastify';

function App() {
  return (
    <>
    <ToastContainer />
    <CameraRecorder />
    </>
  );
}

export default App;
