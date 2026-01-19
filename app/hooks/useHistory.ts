import { useState, useEffect, useCallback } from "react";
import type { HistoryItem, Agent1Result, Agent2Result } from "../types";

const HISTORY_KEY = "decoder_history";
const MAX_HISTORY_ITEMS = 50;

interface CompanyContext {
  companyName?: string;
  website?: string;
  description?: string;
}

interface AddToHistoryParams {
  analysisResult: string;
  filename: string;
  companyContext: CompanyContext;
  metadata?: {
    claims?: Agent1Result;
    strategic?: Agent2Result;
  };
  cost?: number;
  analysisTime?: number;
  tokens?: {
    agent1: { input: number; output: number; total: number };
    agent2: { input: number; output: number; total: number };
    total: number;
  };
}

interface UseHistoryOptions {
  onItemSelected?: (item: HistoryItem) => void;
}

export function useHistory(options: UseHistoryOptions = {}) {
  const { onItemSelected } = options;

  // Core history state
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // UI state for history features
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      console.warn("Could not load history from localStorage");
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((items: HistoryItem[]) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
    } catch (e) {
      if (e instanceof Error && e.name === "QuotaExceededError") {
        const reduced = items.slice(0, Math.floor(items.length / 2));
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(reduced));
          setHistory(reduced);
        } catch {
          console.warn("localStorage quota exceeded, history not saved");
        }
      }
    }
  }, []);

  // Add a new item to history
  const addToHistory = useCallback(
    (params: AddToHistoryParams): HistoryItem => {
      const {
        analysisResult,
        filename,
        companyContext,
        metadata,
        cost,
        analysisTime,
        tokens,
      } = params;

      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        filename: filename || "Text input",
        titlePreview: analysisResult
          ? analysisResult.slice(0, 60).replace(/[#*\n]/g, " ").trim()
          : "Deeper analysis completed",
        analysis: analysisResult,
        companyContext: {
          companyName: companyContext.companyName || undefined,
          website: companyContext.website || undefined,
          description: companyContext.description || undefined,
        },
        metadata,
        cost,
        analysisTime,
        tokens,
      };

      setHistory((prev) => {
        const updated = [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
        saveHistory(updated);
        return updated;
      });

      return newItem;
    },
    [saveHistory]
  );

  // Select an item from history (calls parent callback and closes modals)
  const selectItem = useCallback(
    (item: HistoryItem) => {
      onItemSelected?.(item);
      setShowHistoryModal(false);
      setShowMobileSidebar(false);
    },
    [onItemSelected]
  );

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // Ignore
    }
    setShowClearConfirm(false);
  }, []);

  // Derived state
  const recentHistory = history.slice(0, 10);
  const filteredHistory = history.filter(
    (item) =>
      item.filename.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.titlePreview.toLowerCase().includes(historySearch.toLowerCase())
  );

  return {
    // Core state
    history,
    recentHistory,
    filteredHistory,

    // UI state
    showHistoryModal,
    setShowHistoryModal,
    historySearch,
    setHistorySearch,
    showMobileSidebar,
    setShowMobileSidebar,
    showClearConfirm,
    setShowClearConfirm,

    // Actions
    addToHistory,
    selectItem,
    clearHistory,
  };
}
