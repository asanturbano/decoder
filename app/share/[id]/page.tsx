"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

const SHARED_KEY = "decoder_shared";

interface SharedItem {
  id: string;
  timestamp: number;
  filename: string;
  titlePreview: string;
  analysis: string;
  companyContext: {
    companyName?: string;
    productFocus?: string;
    industry?: string;
    productStage?: string;
  };
  expiresAt: number;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export default function SharePage() {
  const params = useParams();
  const id = params.id as string;
  const [sharedItem, setSharedItem] = useState<SharedItem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SHARED_KEY);
      if (stored) {
        const items: SharedItem[] = JSON.parse(stored);
        const item = items.find((i) => i.id === id && i.expiresAt > Date.now());
        if (item) {
          setSharedItem(item);
        } else {
          setNotFound(true);
        }
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-stone-900 flex items-center justify-center">
        <div className="text-stone-600 dark:text-stone-400">Loading...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-stone-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-4">
            Analysis Not Found
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mb-6">
            This analysis may have expired or the link is invalid.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-[#D97757] text-white font-medium rounded-lg hover:bg-[#C4684A] transition-colors"
          >
            Analyze Your Own Paper
          </Link>
        </div>
      </div>
    );
  }

  const context = sharedItem?.companyContext;
  const hasContext = context?.companyName || context?.productFocus || context?.industry || context?.productStage;

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-[#D97757] hover:text-[#C4684A] text-sm font-medium mb-4 inline-block">
            &larr; Decoder
          </Link>
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            Shared Analysis
          </h1>
          <div className="text-stone-600 dark:text-stone-400 text-sm space-y-1">
            <p>
              <span className="font-medium">File:</span> {sharedItem?.filename}
            </p>
            <p>
              <span className="font-medium">Generated:</span> {formatDate(sharedItem?.timestamp || 0)}
            </p>
            {hasContext && (
              <p>
                <span className="font-medium">Context:</span>{" "}
                {[context?.companyName, context?.productFocus, context?.industry, context?.productStage]
                  .filter(Boolean)
                  .join(" | ")}
              </p>
            )}
          </div>
        </div>

        {/* Analysis Content */}
        <div className="p-6 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg mb-8">
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
                  const isImplications = text.includes("implication") || text.includes("product");
                  return isImplications ? (
                    <div className="mt-8 mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-[#D97757] rounded-r-lg">
                      <h2 className="text-xl font-bold text-stone-900 dark:text-amber-100">{children}</h2>
                    </div>
                  ) : (
                    <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-8 mb-4">{children}</h2>
                  );
                },
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-6 mb-3">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-stone-700 dark:text-stone-300 mb-4 leading-7">{children}</p>
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
                li: ({ children }) => <li className="leading-7 pl-2">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-stone-900 dark:text-stone-100">{children}</strong>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-[#D97757] pl-4 my-4 italic text-stone-600 dark:text-stone-400">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {sharedItem?.analysis || ""}
            </ReactMarkdown>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-6 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
            Want to analyze your own research papers?
          </h2>
          <p className="text-stone-600 dark:text-stone-400 mb-4">
            Extract product implications from AI research with Decoder.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[#D97757] text-white font-medium rounded-lg hover:bg-[#C4684A] transition-colors"
          >
            Analyze Your Own Paper
          </Link>
        </div>
      </div>
    </div>
  );
}
