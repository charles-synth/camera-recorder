import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';

interface ImageCaptureCanvasProps {
    isRecording: boolean;
    intervalSeconds: number;
    onCapture: () => void;
    canvasRef: React.RefObject<HTMLCanvasElement | null>; // ✅ allow null
    playShutterClickSound: boolean;
}

const ImageCaptureCanvas: React.FC<ImageCaptureCanvasProps> = ({ intervalSeconds, onCapture, isRecording, playShutterClickSound }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countdown, setCountdown] = useState(intervalSeconds);
  const [flash, setFlash] = useState(false);
  const beepRef = useRef<HTMLAudioElement | null>(null);
    const [hasBeeped, setHasBeeped] = useState(false);

    useEffect(() => {
        if(!isRecording) return;
        
        const interval = setInterval(() => {
          setCountdown(prev => {
            const next = prev - 1;
      
            if (next === 0) {
              onCapture();
              setHasBeeped(false); // Reset beep state for next cycle
              return intervalSeconds;
            }
      
            if (next === 1 && !hasBeeped) {
                if(playShutterClickSound){
                    if (!beepRef.current) {
                        beepRef.current = new Audio("/sounds/shutter-click.wav");
                    }
                    beepRef.current.play().catch(err => console.error("Beep error", err));
                }
                setHasBeeped(true);
            }
      
            return next;
          });
        }, 1000);
      
        return () => clearInterval(interval);
      }, [onCapture, hasBeeped]);

      
    useEffect(() => {
        setCountdown(intervalSeconds);
        }, [intervalSeconds]
    )

  const triggerFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 100); // Quick flash
  };

    // Fade and zoom intensity
    const maxCount = intervalSeconds;
    const opacity = Math.max(0.2, 1 - countdown / maxCount); // min 0.2 → max 1
    const scale = 1 + (1 - countdown / maxCount) * 0.5;       // 1 → 1.5 as it nears 0

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
        width="100%"
        height="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        zIndex={3}
        sx={{ pointerEvents: 'none' }}
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
