import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Pause, Clock, X } from "lucide-react";
import { formatTime } from "@/lib/quiz-logic";

interface ProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
  progress: number;
  timeRemaining?: number | null;
  onPause?: () => void;
  onExit?: () => void;
}

export function ProgressBar({
  currentQuestion,
  totalQuestions,
  progress,
  timeRemaining,
  onPause,
  onExit
}: ProgressBarProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {onPause && (
            <Button variant="ghost" size="icon" onClick={onPause}>
              <Pause className="h-4 w-4" />
            </Button>
          )}
          <div className="text-sm text-gray-500">
            <span>Frage </span>
            <span className="font-semibold text-primary">{currentQuestion}</span>
            <span> von </span>
            <span className="font-semibold">{totalQuestions}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {timeRemaining !== null && timeRemaining !== undefined && (
            <div className="text-sm text-gray-500 font-mono flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {timeRemaining < 0 ? formatTime(Math.abs(timeRemaining)) : formatTime(timeRemaining)}
            </div>
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
