import { useRef } from "react";

interface FileDropzoneProps {
  pdfFileName: string;
  isDragging: boolean;
  isLoading: boolean;
  onFileSelect: (file: File) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onClear: () => void;
}

export function FileDropzone({
  pdfFileName,
  isDragging,
  isLoading,
  onFileSelect,
  onDrop,
  onDragOver,
  onDragLeave,
  onClear,
}: FileDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      {!pdfFileName && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors min-h-[120px] ${
            isDragging
              ? "border-[#D97757] bg-amber-50 dark:bg-amber-900/20"
              : "border-stone-300 dark:border-stone-600 hover:border-[#D97757]"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
            }}
            disabled={isLoading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <svg
            className="mx-auto h-12 w-12 text-stone-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m0 0v4a4 4 0 004 4h20a4 4 0 004-4V20m-24 16l8-8m0 0l8 8m-8-8v16M36 20V12a4 4 0 00-4-4h-4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            <span className="font-medium text-[#D97757]">Drop PDF here</span> or click to upload
          </p>
          <p className="mt-1 text-xs text-stone-500">PDF only, max 10MB</p>
        </div>
      )}

      {pdfFileName && (
        <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg">
          <div className="flex items-center gap-3">
            <svg className="h-8 w-8 text-[#D97757]" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <div className="text-sm font-medium text-stone-700 dark:text-stone-300">
                {pdfFileName}
              </div>
              <div className="text-xs text-stone-500">Ready to analyze</div>
            </div>
          </div>
          <button
            onClick={onClear}
            disabled={isLoading}
            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
