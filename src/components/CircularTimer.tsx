import { useEffect, useState } from "react";

interface CircularTimerProps {
  seconds: number;
  isActive: boolean;
  onComplete?: () => void;
}

export function CircularTimer({ seconds, isActive, onComplete }: CircularTimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const percentage = (timeLeft / seconds) * 100;

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onComplete]);

  const getColor = () => {
    if (percentage > 50) return "stroke-green-500";
    if (percentage > 25) return "stroke-yellow-500";
    return "stroke-red-500";
  };

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90 w-32 h-32">
        {/* Background circle */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${getColor()} transition-all duration-1000 ease-linear`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{timeLeft}s</span>
      </div>
    </div>
  );
}
