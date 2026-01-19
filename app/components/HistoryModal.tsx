import { HistoryItem } from "../types";
import { getRelativeTime } from "../utils";

interface HistoryModalProps {
  show: boolean;
  history: HistoryItem[];
  filteredHistory: HistoryItem[];
  search: string;
  onSearchChange: (value: string) => void;
  onLoadItem: (item: HistoryItem) => void;
  onClose: () => void;
}

const inputClassName =
  "w-full p-3 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:ring-2 focus:ring-amber-600 focus:border-transparent";

export function HistoryModal({
  show,
  history,
  filteredHistory,
  search,
  onSearchChange,
  onLoadItem,
  onClose,
}: HistoryModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-stone-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Analysis History
            </h2>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600"
            >
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
          <input
            type="text"
            placeholder="Search history..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`${inputClassName} text-sm`}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {filteredHistory.length === 0 ? (
            <p className="text-center text-stone-500 py-8">
              {history.length === 0 ? "No analysis history yet" : "No results found"}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onLoadItem(item)}
                  className="w-full text-left p-3 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      {item.filename}
                    </span>
                    <span className="text-xs text-stone-400">
                      {getRelativeTime(item.timestamp)}
                    </span>
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
    </div>
  );
}
