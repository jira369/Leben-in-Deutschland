import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Timer } from "./timer";
import { Pause, X } from "lucide-react";

interface ProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
  progress: number;
  onPause?: () => void;
  onExit?: () => void;
  quizType?: 'full' | 'practice';
  startTime?: number;
  onTimeUp?: () => void;
  timerEnabled?: boolean;
}

export function ProgressBar({
  currentQuestion,
  totalQuestions,
  progress,
  onPause,
  onExit,
  quizType = 'practice',
  startTime,
  onTimeUp,
  timerEnabled = true
}: ProgressBarProps) {
  return (
    <div className="bg-card rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {onPause && (
            <Button variant="ghost" size="icon" onClick={onPause}>
              <Pause className="h-4 w-4" />
            </Button>
          )}
          <div className="text-sm text-muted-foreground">
            <span>Frage </span>
            <span className="font-semibold text-primary">{currentQuestion}</span>
            <span> von </span>
            <span className="font-semibold">{totalQuestions}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {startTime && quizType && timerEnabled && (
            <Timer
              mode={quizType === 'full' ? 'countdown' : 'countup'}
              initialSeconds={quizType === 'full' ? 3600 : undefined}
              startTime={startTime}
              onTimeUp={onTimeUp}
            />
          )}
          {onExit && (
            <Button variant="ghost" size="sm" onClick={onExit}>
              Beenden
            </Button>
          )}
        </div>
      </div>
      
      <Progress value={progress} className="w-full" />
    </div>
  );
}
