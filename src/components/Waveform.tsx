import { useEffect, useRef, useState } from "react";

interface WaveformProps {
  analyser: AnalyserNode | null;
  isRecording: boolean;
}

export function Waveform({ analyser, isRecording }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!analyser || !canvasRef.current || !isRecording) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!ctx || !canvas) return;

      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      // Set canvas size
      const width = canvas.width;
      const height = canvas.height;

      // Get CSS custom properties for theme colors
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
      const strokeColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-foreground').trim();

      // Clear canvas
      ctx.fillStyle = `hsl(${bgColor})`;
      ctx.fillRect(0, 0, width, height);

      // Draw waveform
      ctx.lineWidth = 3;
      ctx.strokeStyle = `hsl(${strokeColor})`;
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
    };
  }, [analyser, isRecording]);

  return (
    <div className="relative w-full glass-medium backdrop-blur-xl rounded-2xl p-2 shadow-glass-lg">
      <canvas
        ref={canvasRef}
        width={800}
        height={120}
        className="w-full h-[80px] sm:h-[100px] lg:h-[120px] rounded-lg transition-all duration-200"
      />
    </div>
  );
}
