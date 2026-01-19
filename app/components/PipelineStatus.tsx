import { LoadingSpinner } from "./LoadingSpinner";

interface PipelineStatusProps {
  pipelineRunning: boolean;
  currentAgent: number | null;
  elapsedTime: number;
  canResume: boolean;
  onPause: () => void;
  onResume: () => void;
}

export function PipelineStatus({
  pipelineRunning,
  currentAgent,
  elapsedTime,
  canResume,
  onPause,
  onResume,
}: PipelineStatusProps) {
  // Pipeline Running State
  if (pipelineRunning && currentAgent) {
    return (
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <LoadingSpinner />
              <span className="text-blue-900 dark:text-blue-100 font-medium">
                {currentAgent === 1 && "Extracting claims and key excerpts..."}
                {currentAgent === 2 && "Analyzing product implications..."}
              </span>
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300 ml-8">
              Step {currentAgent} of 2 • Elapsed: {Math.floor(elapsedTime / 1000)}s
            </div>
          </div>
          <button
            onClick={onPause}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
          >
            Pause
          </button>
        </div>
      </div>
    );
  }

  // Resume Indicator
  if (!pipelineRunning && canResume) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-yellow-900 dark:text-yellow-100">
              Analysis Paused
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Agent 1 completed. Click Resume to continue with strategic analysis.
            </div>
          </div>
          <button
            onClick={onResume}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
          >
            Resume
          </button>
        </div>
      </div>
    );
  }

  return null;
}
