import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface TimerProps {
  mode: 'countdown' | 'countup';
  initialSeconds?: number; // For countdown mode (default: 3600 = 60 minutes)
  startTime: number; // Unix timestamp when quiz started
  onTimeUp?: () => void; // Called when countdown reaches 0
}

export function Timer({ mode, initialSeconds = 3600, startTime, onTimeUp }: TimerProps) {
  const [seconds, setSeconds] = useState(() => {
    if (mode === 'countdown') {
      // Calculate remaining time based on elapsed time since start
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      return Math.max(0, initialSeconds - elapsed);
    } else {
      // Calculate elapsed time since start
      return Math.floor((Date.now() - startTime) / 1000);
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (mode === 'countdown') {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, initialSeconds - elapsed);
        setSeconds(remaining);
        
        if (remaining === 0 && onTimeUp) {
          onTimeUp();
        }
      } else {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setSeconds(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, initialSeconds, startTime, onTimeUp]);

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (mode === 'countdown') {
      if (seconds <= 300) return 'text-red-600 dark:text-red-400'; // Last 5 minutes
      if (seconds <= 600) return 'text-orange-600 dark:text-orange-400'; // Last 10 minutes
      return 'text-muted-foreground';
    }
    return 'text-muted-foreground';
  };

  return (
    <div className={`flex items-center gap-1 ${getTimerColor()}`}>
      <Clock className="h-4 w-4" />
      <span className="font-mono text-sm">
        {formatTime(seconds)}
      </span>
    </div>
  );
}