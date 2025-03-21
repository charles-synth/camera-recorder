import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';

interface ImageCaptureCanvasProps {
    isRecording: boolean;
    intervalSeconds: number;
    onCapture: () => void;
    canvasRef: React.RefObject<HTMLCanvasElement | null>; // ✅ allow null
}

const ImageCaptureCanvas: React.FC<ImageCaptureCanvasProps> = ({ intervalSeconds, onCapture, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countdown, setCountdown] = useState(intervalSeconds);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if(!isRecording) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          triggerFlash();
          onCapture();
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [intervalSeconds, onCapture]);

  const triggerFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 100); // Quick flash
  };

  // Fade and zoom intensity
  const visible = countdown <= 30;
  const opacity = 1;//visible ? 1 - (countdown - 1) * 0.3 : 0;
  const scale = 1; //visible ? 1 + (1 - countdown / 3) * 0.5 : 1; // Zoom in as countdown approaches 0

  return (
    <Box position="absolute"
        top={0}
        left={0}
        width={'1100'}
        minHeight={900}
        sx={{backgroundColor: 'transparent'}}
    > 
      <canvas
        ref={canvasRef}
        width={'1100'}
        height={'900'}
        style={{ border: '1px solid #ccc', zIndex: 1}}
      />

      {/* Flash overlay */}
      {flash && (
        <Box
          position="absolute"
          top={0}
          left={0}
          width="1100px"
          height="900px"
          bgcolor="white"
          zIndex={400}
          sx={{ opacity: 0.8, animation: 'flashFade 0.2s ease-out' }}
        />
      )}

      {/* Countdown display */}
      <Box
        position="absolute"
        top={0}
        left={0}
        width="1100px"
        height="900px"
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ pointerEvents: 'none' }}
        zIndex={300}
      >
        <Typography
          variant="h3"
          component="div"
          color="white"
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: 2,
            padding: '0.5rem 1.5rem',
            opacity,
            transform: `scale(${scale})`,
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
          }}
        >
          {countdown}
        </Typography>
      </Box>

      {/* Flash animation keyframes */}
      <style>{`
        @keyframes flashFade {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
      `}</style>
    </Box>
  );
};

export default ImageCaptureCanvas;
