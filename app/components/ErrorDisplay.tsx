interface ErrorDisplayProps {
  error: string;
  isPipelineError?: boolean;
  currentAgent?: number | null;
  maxRetries?: number;
  retryCount?: number;
  onRetry: () => void;
}

export function ErrorDisplay({
  error,
  isPipelineError = false,
  currentAgent,
  maxRetries = 3,
  retryCount = 0,
  onRetry,
}: ErrorDisplayProps) {
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg no-print">
      <div className="flex items-start gap-3">
        <svg
          className="h-5 w-5 text-red-500 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-red-700 dark:text-red-400 font-medium">
            {isPipelineError ? "Pipeline failed" : "Analysis failed"}
          </p>
          <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
          {currentAgent && (
            <p className="text-red-500 text-sm mt-1">
              Failed at Agent {currentAgent}
            </p>
          )}
          {retryCount >= maxRetries && (
            <p className="text-red-500 text-sm mt-2">
              Multiple retries failed. Try a smaller PDF or check your connection.
            </p>
          )}
          <button
            onClick={onRetry}
            className="mt-3 px-4 py-2 min-h-[44px] bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry {isPipelineError ? "Pipeline" : "Analysis"}
          </button>
        </div>
      </div>
    </div>
  );
}
