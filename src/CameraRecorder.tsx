import React, { useRef, useState, useEffect } from "react";
import { Button, TextField, MenuItem, Select, FormControl, InputLabel, Container } from "@mui/material";
import Grid from '@mui/material/Grid2';
import axios from "axios";
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  ...theme.applyStyles('dark', {
    backgroundColor: '#1A2027',
  }),
}));

const CameraRecorder: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [intervalTime, setIntervalTime] = useState(5000);
  const [trainingStorageAccountUrl, setTraningStorageAccountUrl] = useState("");
  const [trainingContainerName, setTraningContainerName] = useState("");
  const [trainingSasToken, setTraningSasToken] = useState("");

  const [inferenceStorageAccountUrl, setInferenceStorageAccountUrl] = useState("");
  const [inferenceContainerName, setInferenceContainerName] = useState("");
  const [inferenceSasToken, setInferenceSasToken] = useState("");

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState("user"); // "user" = front, "environment" = back
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef1 = useRef<HTMLAudioElement | null>(null);
  const audioRef2 = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isCameraOn) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isCameraOn, facingMode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureAndUploadImage = async (accountUrl: string, containerName: string, sasToken: string) => {
    toast.info(`captureAndUploadImage`);
    if (!canvasRef.current || !videoRef.current || !trainingStorageAccountUrl) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (context) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      toast.info(`Next image capture in ${intervalTime / 1000} seconds`, { autoClose: intervalTime });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const fileName = `snapshot_${Date.now()}.png`;
        const file = new File([blob], fileName, { type: "image/png" });
        const formData = new FormData();
        formData.append("file", file);

        const uploadUrl = `${accountUrl}${containerName}/${fileName}${sasToken}`;

        try {
          await axios.put(uploadUrl.replace('{filename}', fileName), blob, {
            headers: {
                "x-ms-blob-type": "BlockBlob",
                "x-ms-version": "2021-08-06",           // Explicit Azure API version
                "Content-Type": "image/png",
                "x-ms-date": new Date().toUTCString(), // Ensures timestamp is included
            },
          });
          console.log("Image uploaded successfully");
        } catch (error) {
          console.error("Error uploading image:", error);
        }
      }, "image/png");
    }
  };

  const startRecordingTrainingImages = () => {
    if (!trainingStorageAccountUrl || !trainingContainerName || !trainingSasToken) {
      alert("Please enter valid Training Azure Container Credentials");
      return;
    }
    setIsRecording(true);
    intervalRef.current = setInterval(() => captureAndUploadImage(trainingStorageAccountUrl, trainingContainerName, trainingSasToken), intervalTime);
  };

  const startRecordingInferenceImages = () => {
    if (!inferenceStorageAccountUrl || !inferenceContainerName || !inferenceSasToken) {
      alert("Please enter valid Inference Azure Container Credentials");
      return;
    }
    setIsRecording(true);
    intervalRef.current = setInterval(() => captureAndUploadImage(inferenceStorageAccountUrl, inferenceContainerName, inferenceSasToken), intervalTime);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const toggleCamera = () => {
    setIsCameraOn((prev) => !prev);
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const playSound = () => {
    if (!audioRef1.current) {
      audioRef1.current = new Audio("/sounds/arcade.wav"); // Sound file in `public/` folder
    }
    audioRef1.current.play().catch((error) => console.error("Error playing sound:", error));
  };

  const playSound2 = () => {
    if (!audioRef2.current) {
      audioRef2.current = new Audio("/sounds/cartoon-toy-whistle.wav"); // Sound file in `public/` folder
    }
    audioRef2.current.play().catch((error) => console.error("Error playing sound:", error));
  };

  return (
    <Container>
      <h2>Camera Recorder</h2>
      <video ref={videoRef} autoPlay playsInline style={{ width: "100%" }} />
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
      <FormControl fullWidth margin="normal">
        <InputLabel>Interval</InputLabel>
        <Select value={intervalTime} onChange={(e) => setIntervalTime(Number(e.target.value))}>
          <MenuItem value={5000}>5 seconds</MenuItem>
          <MenuItem value={30000}>30 seconds</MenuItem>
        </Select>
      </FormControl>

      <Grid container spacing={2}>
            <Grid size={12}>
                <Button variant="contained" color="warning" onClick={toggleCamera}>
                    {isCameraOn ? "Stop Camera" : "Start Camera"}
                </Button>
                <Button variant="contained" color="info" onClick={switchCamera} sx={{ml: '1em'}}>
                    Switch Camera
                </Button>
                {facingMode}
            </Grid>
            <Grid size={6}>
                <Item>Training Images</Item>
            </Grid>
            <Grid size={6}>
                <Item>Inference Images</Item>
            </Grid>
            <Grid size={6}>
                <Item>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Azure Storage Account URL"
                        variant="outlined"
                        value={trainingStorageAccountUrl}
                        onChange={(e) => setTraningStorageAccountUrl(e.target.value)}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Container Name"
                        variant="outlined"
                        value={trainingContainerName}
                        onChange={(e) => setTraningContainerName(e.target.value)}
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Sas Token"
                        variant="outlined"
                        value={trainingSasToken}
                        onChange={(e) => setTraningSasToken(e.target.value)}
                    />
                    <Button variant="contained" color="primary" onClick={startRecordingTrainingImages} disabled={isRecording}>
                        Record
                    </Button>
                    <Button variant="contained" color="secondary" onClick={stopRecording} disabled={!isRecording}>
                        Stop
                    </Button>
                </Item>
            </Grid>
            <Grid size={6}>
                <Item>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Azure Storage Account URL"
                        variant="outlined"
                        value={inferenceStorageAccountUrl}
                        onChange={(e) => setInferenceStorageAccountUrl(e.target.value)}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Container Name"
                        variant="outlined"
                        value={inferenceContainerName}
                        onChange={(e) => setInferenceContainerName(e.target.value)}
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Sas Token"
                        variant="outlined"
                        value={inferenceSasToken}
                        onChange={(e) => setInferenceSasToken(e.target.value)}
                    />
                    <Button variant="contained" color="primary" onClick={startRecordingInferenceImages} disabled={isRecording}>
                        Record
                    </Button>
                    <Button variant="contained" color="secondary" onClick={stopRecording} disabled={!isRecording}>
                        Stop
                    </Button>
                </Item>
            </Grid>
        </Grid>

      <Button variant="contained" color="success" onClick={() => {
        toast.info(`playSound`);
        playSound()
      }}>
        Play Sound
      </Button>
      <Button variant="contained" color="success" onClick={() => {
        toast.info(`playSound2`);
        playSound2()
      }}>
        Play Sound
      </Button>
    </Container>
  );
};

export default CameraRecorder;
