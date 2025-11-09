import { useEffect, useRef, useState } from "react";

interface WaveformProps {
  analyser: AnalyserNode | null;
  isRecording: boolean;
  onFillerWord?: () => void;
}

export function Waveform({ analyser, isRecording, onFillerWord }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [fillerWordFlash, setFillerWordFlash] = useState(false);

  useEffect(() => {
    if (!analyser || !canvasRef.current || !isRecording) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Simulate filler word detection (random flashes for demo)
    // In production, you'd use actual speech-to-text analysis
    const fillerWordInterval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance per interval
        setFillerWordFlash(true);
        onFillerWord?.();
        setTimeout(() => setFillerWordFlash(false), 200);
      }
    }, 2000);

    const draw = () => {
      if (!ctx || !canvas) return;

      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      // Set canvas size
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.fillStyle = fillerWordFlash ? 'hsl(38, 92%, 50%)' : 'hsl(217, 91%, 60%)';
      ctx.fillRect(0, 0, width, height);

      // Draw waveform
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'hsl(0, 0%, 100%)';
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearInterval(fillerWordInterval);
    };
  }, [analyser, isRecording, fillerWordFlash, onFillerWord]);

  return (
    <div className="relative w-full glass-medium backdrop-blur-xl rounded-2xl p-2 shadow-glass-lg">
      <canvas
        ref={canvasRef}
        width={800}
        height={120}
        className="w-full h-[120px] rounded-lg transition-all duration-200"
      />
      {fillerWordFlash && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-white font-bold text-lg glass-heavy backdrop-blur-xl px-6 py-3 rounded-full animate-scale-in shadow-glass-lg">
            Filler word detected!
          </span>
        </div>
      )}
    </div>
  );
}
