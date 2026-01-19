import { HistoryItem } from "../types";
import { getRelativeTime } from "../utils";

interface HistorySidebarProps {
  history: HistoryItem[];
  recentHistory: HistoryItem[];
  showMobile: boolean;
  onLoadItem: (item: HistoryItem) => void;
  onViewAll: () => void;
  onClear: () => void;
  onCloseMobile: () => void;
}

export function HistorySidebar({
  history,
  recentHistory,
  showMobile,
  onLoadItem,
  onViewAll,
  onClear,
  onCloseMobile,
}: HistorySidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed right-0 top-0 w-[300px] h-screen bg-white dark:bg-stone-800 border-l border-stone-200 dark:border-stone-700 p-4 overflow-y-auto">
        <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
          Recent Analyses
        </h2>
        {recentHistory.length === 0 ? (
          <p className="text-sm text-stone-500">No analyses yet</p>
        ) : (
          <div className="space-y-2">
            {recentHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => onLoadItem(item)}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700"
              >
                <div className="text-xs text-stone-400 mb-1">
                  {getRelativeTime(item.timestamp)}
                </div>
                <div className="text-sm font-medium text-stone-700 dark:text-stone-300 truncate">
                  {item.filename}
                </div>
                <div className="text-xs text-stone-500 truncate">
                  {item.titlePreview}
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="mt-4 space-y-2">
          <button
            onClick={onViewAll}
            className="w-full text-sm text-[#D97757] font-medium"
          >
            View All History
          </button>
          {history.length > 0 && (
            <button
              onClick={onClear}
              className="w-full text-sm text-stone-500 hover:text-red-600"
            >
              Clear History
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {showMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={onCloseMobile}
        >
          <div
            className="absolute right-0 top-0 w-full max-w-sm h-full bg-white dark:bg-stone-800 p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                History
              </h2>
              <button onClick={onCloseMobile} className="p-2 text-stone-400">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-stone-500 py-4">No analyses yet</p>
            ) : (
              <div className="space-y-3">
                {history.slice(0, 10).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onLoadItem(item)}
                    className="w-full text-left p-3 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700"
                  >
                    <div className="text-xs text-stone-400 mb-1">
                      {getRelativeTime(item.timestamp)}
                    </div>
                    <div className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      {item.filename}
                    </div>
                    <div className="text-xs text-stone-500 truncate">
                      {item.titlePreview}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
