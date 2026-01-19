import ReactMarkdown from "react-markdown";

interface QuickAnalysisViewProps {
  analysis: string;
  showExportMenu: boolean;
  onToggleExportMenu: () => void;
  onShare: () => void;
  onExportMarkdown: () => void;
  onExportPdf: () => void;
}

export function QuickAnalysisView({
  analysis,
  showExportMenu,
  onToggleExportMenu,
  onShare,
  onExportMarkdown,
  onExportPdf,
}: QuickAnalysisViewProps) {
  return (
    <div className="analysis-results p-6 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg">
      <div className="flex items-center justify-between mb-6 no-print">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          Analysis Results
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onShare}
            className="px-3 py-1.5 text-sm text-[#D97757] hover:text-[#C4684A] font-medium"
          >
            Share
          </button>
          <div className="relative">
            <button
              onClick={onToggleExportMenu}
              className="px-3 py-1.5 text-sm bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-600 font-medium flex items-center gap-1"
            >
              Export
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg z-10">
                <button
                  onClick={onExportMarkdown}
                  className="w-full text-left px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                >
                  Download as Markdown
                </button>
                <button
                  onClick={onExportPdf}
                  className="w-full text-left px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                >
                  Save as PDF (Print)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="text-base leading-relaxed">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-8 mb-4 pb-2 border-b border-stone-200 dark:border-stone-700">
                {children}
              </h1>
            ),
            h2: ({ children }) => {
              const text = String(children).toLowerCase();
              const isImplications =
                text.includes("implication") || text.includes("product");
              return isImplications ? (
                <div className="mt-8 mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-[#D97757] rounded-r-lg print:bg-gray-100">
                  <h2 className="text-xl font-bold text-stone-900 dark:text-amber-100">
                    {children}
                  </h2>
                </div>
              ) : (
                <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-8 mb-4">
                  {children}
                </h2>
              );
            },
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-6 mb-3">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-stone-700 dark:text-stone-300 mb-4 leading-7">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-stone-700 dark:text-stone-300">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-stone-700 dark:text-stone-300">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="leading-7 pl-2">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-stone-900 dark:text-stone-100">
                {children}
              </strong>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-[#D97757] pl-4 my-4 italic text-stone-600 dark:text-stone-400">
                {children}
              </blockquote>
            ),
          }}
        >
          {analysis}
        </ReactMarkdown>
      </div>
    </div>
  );
}
