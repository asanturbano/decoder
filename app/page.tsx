"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  HistoryItem,
  SharedItem,
  Agent1Response,
  Agent2Response,
  PipelineState,
} from "./types";
import {
  formatDate,
  extractPaperTitle,
  cleanPaper,
  logAgentCost,
  generateStrategicMarkdown,
} from "./utils";
import {
  LoadingSpinner,
  ShareToast,
  CompletionBanner,
  ErrorDisplay,
  ConfirmModal,
  FileDropzone,
  CompanyContextForm,
  StrategicAnalysisView,
  QuickAnalysisView,
  HistorySidebar,
  HistoryModal,
  PipelineStatus,
} from "./components";
import { useHistory } from "./hooks";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SHARED_KEY = "decoder_shared";
const RUNS_REMAINING_KEY = "multi_agent_runs_remaining";
const ANALYSIS_TIMEOUT = 90000; // 90 seconds

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [paperText, setPaperText] = useState("");
  const [pdfBase64, setPdfBase64] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState("");
  const [error, setError] = useState("");
  const [useTextInput, setUseTextInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Export state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  // Usage limit state
  const [multiAgentRunsRemaining, setMultiAgentRunsRemaining] = useState(3);

  // Multi-agent pipeline state
  const [pipelineState, setPipelineState] = useState<PipelineState>({
    currentAgent: null,
    startTime: null,
    agent1Result: null,
    agent2Result: null,
    totalCost: 0,
    error: null,
  });
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pipelinePaused, setPipelinePaused] = useState(false);
  const [canResume, setCanResume] = useState(false);
  const [wasAwayDuringCompletion, setWasAwayDuringCompletion] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  // Tab and confirmation state
  const [activeTab, setActiveTab] = useState<'quick' | 'strategic' | null>(null);
  const [showClearConfirmAnalysis, setShowClearConfirmAnalysis] = useState(false);
  const [pendingAnalysisType, setPendingAnalysisType] = useState<'quick' | 'strategic' | null>(null);

  // Collapsible section state
  const [expandedSections, setExpandedSections] = useState({
    agent1: false,
    agent2: true,
    details: false,
  });

  // History hook with callback for when an item is selected
  const handleHistoryItemSelected = useCallback((item: HistoryItem) => {
    setAnalysis(item.analysis);
    setCompanyName(item.companyContext.companyName || "");
    setWebsite(item.companyContext.website || "");
    setDescription(item.companyContext.description || "");

    // Restore pipelineState for multi-agent analyses
    if (item.metadata?.strategic && item.metadata?.claims) {
      setPipelineState({
        currentAgent: null,
        startTime: null,
        agent1Result: {
          claims: item.metadata.claims,
          metadata: {
            duration: item.analysisTime || 0,
            tokens: { input: 0, output: 0, total: 0 },
            cost: item.cost || 0,
          },
        },
        agent2Result: {
          strategic: item.metadata.strategic,
          metadata: {
            duration: 0,
            tokens: { input: 0, output: 0, total: 0 },
            cost: 0,
          },
        },
        totalCost: item.cost || 0,
        error: null,
      });
    } else {
      // Clear pipelineState for single-agent analyses
      setPipelineState({
        currentAgent: null,
        startTime: null,
        agent1Result: null,
        agent2Result: null,
        totalCost: 0,
        error: null,
      });
    }
  }, []);

  const {
    history,
    recentHistory,
    filteredHistory,
    showHistoryModal,
    setShowHistoryModal,
    historySearch,
    setHistorySearch,
    showMobileSidebar,
    setShowMobileSidebar,
    showClearConfirm,
    setShowClearConfirm,
    addToHistory,
    selectItem: selectHistoryItem,
    clearHistory,
  } = useHistory({ onItemSelected: handleHistoryItemSelected });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pipelineAbortRef = useRef<AbortController | null>(null);
  const elapsedTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load cost and runs remaining from localStorage
  useEffect(() => {
    // Load total cost from localStorage
    try {
      const storedCost = localStorage.getItem("total_cost");
      if (storedCost) {
        setPipelineState((prev) => ({
          ...prev,
          totalCost: parseFloat(storedCost),
        }));
      }
    } catch {
      console.warn("Could not load cost from localStorage");
    }

    // Load multi-agent runs remaining from localStorage
    try {
      const storedRuns = localStorage.getItem(RUNS_REMAINING_KEY);
      if (storedRuns) {
        setMultiAgentRunsRemaining(parseInt(storedRuns));
      }
    } catch {
      console.warn("Could not load runs remaining from localStorage");
    }
  }, []);

  // Track elapsed time during pipeline execution
  useEffect(() => {
    if (pipelineRunning && pipelineState.startTime) {
      elapsedTimeIntervalRef.current = setInterval(() => {
        setElapsedTime(Date.now() - pipelineState.startTime!);
      }, 1000);
    } else {
      if (elapsedTimeIntervalRef.current) {
        clearInterval(elapsedTimeIntervalRef.current);
        elapsedTimeIntervalRef.current = null;
      }
    }

    return () => {
      if (elapsedTimeIntervalRef.current) {
        clearInterval(elapsedTimeIntervalRef.current);
      }
    };
  }, [pipelineRunning, pipelineState.startTime]);

  // Check for paused analysis on mount and restore state
  useEffect(() => {
    const savedStateStr = sessionStorage.getItem('pausedPipelineState');
    if (savedStateStr) {
      try {
        const savedState = JSON.parse(savedStateStr);
        const { agent1Result, companyContext, timestamp } = savedState;

        // Only restore if less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setCanResume(true);
          setPipelineState({
            currentAgent: null,
            startTime: null,
            agent1Result: agent1Result,
            agent2Result: null,
            totalCost: agent1Result.metadata.cost,
            error: null,
          });

          // Restore company context
          setCompanyName(companyContext.companyName || "");
          setWebsite(companyContext.website || "");
          setDescription(companyContext.description || "");
        } else {
          // Clear stale state
          sessionStorage.removeItem('pausedPipelineState');
        }
      } catch {
        // Invalid saved state, clear it
        sessionStorage.removeItem('pausedPipelineState');
      }
    }
  }, []);

  // Track page visibility for completion notifications
  useEffect(() => {
    const handleVisibilityChange = () => {
      const nowVisible = !document.hidden;
      setPageVisible(nowVisible);

      if (nowVisible) {
        // Reset title when user returns
        document.title = "Research PM";

        // Clear away indicator after 5 seconds
        if (wasAwayDuringCompletion) {
          setTimeout(() => setWasAwayDuringCompletion(false), 5000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [wasAwayDuringCompletion]);

  // Auto-set active tab when results appear
  useEffect(() => {
    // If no tab is active but results exist, set default tab
    if (!activeTab) {
      if (pipelineState.agent2Result) {
        setActiveTab('strategic');
      } else if (analysis) {
        setActiveTab('quick');
      }
    }
  }, [analysis, pipelineState.agent2Result, activeTab]);

  async function handleFileSelect(file: File) {
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be less than 10MB");
      return;
    }

    setError("");
    setPdfFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      setPdfBase64(base64);
    };
    reader.onerror = () => {
      setError("Failed to read file");
      setPdfFileName("");
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function clearPdf() {
    setPdfBase64("");
    setPdfFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAnalyze(isRetry = false) {
    const hasContent = useTextInput ? paperText.trim() : pdfBase64;
    if (!hasContent) {
      setError(
        useTextInput
          ? "Please paste some paper text to analyze"
          : "Please upload a PDF to analyze"
      );
      return;
    }

    // Check if we need to confirm clearing previous results
    if (!isRetry && (analysis || pipelineState.agent2Result)) {
      setPendingAnalysisType('quick');
      setShowClearConfirmAnalysis(true);
      return;
    }

    if (!isRetry) {
      setRetryCount(0);
    }

    setPendingAnalysisType(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError("");
    setAnalysis("");
    setCurrentSection("Starting analysis...");

    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setError("Analysis timed out. The request took longer than 90 seconds.");
      setIsLoading(false);
      setCurrentSection("");
    }, ANALYSIS_TIMEOUT);

    try {
      const normalizedWebsite = website.trim()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '');

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperText: useTextInput ? paperText : undefined,
          pdfBase64: useTextInput ? undefined : pdfBase64,
          companyName: companyName.trim() || undefined,
          website: normalizedWebsite || undefined,
          description: description.trim() || undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment and try again.");
        } else if (response.status === 401) {
          throw new Error("API authentication failed. Please check your API key.");
        }
        throw new Error(data.error || "Failed to analyze paper");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let streamedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "section") {
                setCurrentSection(data.section);
              } else if (data.type === "text") {
                streamedText += data.text;
                setAnalysis(streamedText);
              } else if (data.type === "done") {
                setCurrentSection("");
                addToHistory({
                  analysisResult: streamedText,
                  filename: useTextInput ? extractPaperTitle(paperText) : pdfFileName,
                  companyContext: { companyName, website, description },
                });
                setRetryCount(0);
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          return;
        }
        console.error("Analysis error:", err);
        setError(err.message);
        setRetryCount((prev) => prev + 1);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setIsLoading(false);
      setCurrentSection("");
    }
  }

  function handleRetry() {
    handleAnalyze(true);
  }

  async function runMultiAgentAnalysis() {
    const hasContent = useTextInput ? paperText.trim() : pdfBase64;
    if (!hasContent) {
      setError(
        useTextInput
          ? "Please paste some paper text to analyze"
          : "Please upload a PDF to analyze"
      );
      return;
    }

    if (!companyName.trim()) {
      setError("Please enter a company name for multi-agent analysis");
      return;
    }

    if (analysis || pipelineState.agent2Result) {
      setPendingAnalysisType('strategic');
      setShowClearConfirmAnalysis(true);
      return;
    }

    runMultiAgentAnalysisConfirmed();
  }

  async function runMultiAgentAnalysisConfirmed() {
    const hasContent = useTextInput ? paperText.trim() : pdfBase64;
    if (!hasContent) {
      setError(
        useTextInput
          ? "Please paste some paper text to analyze"
          : "Please upload a PDF to analyze"
      );
      return;
    }

    if (!companyName.trim()) {
      setError("Please enter a company name for multi-agent analysis");
      return;
    }

    setPendingAnalysisType(null);
    setAnalysis("");

    setPipelineRunning(true);
    setError("");
    setPipelineState({
      currentAgent: 1,
      startTime: Date.now(),
      agent1Result: null,
      agent2Result: null,
      totalCost: pipelineState.totalCost,
      error: null,
    });
    setElapsedTime(0);

    let cumulativeCost = pipelineState.totalCost;
    pipelineAbortRef.current = new AbortController();

    try {
      const cleanedPaper = useTextInput ? cleanPaper(paperText) : null;

      setPipelineState((prev) => ({ ...prev, currentAgent: 1 }));
      console.log("Starting Agent 1: Claims & Excerpts Extractor");

      const agent1Response = await fetch("/api/agent1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperText: cleanedPaper,
          pdfBase64: useTextInput ? undefined : pdfBase64,
        }),
        signal: pipelineAbortRef.current.signal,
      });

      if (!agent1Response.ok) {
        const errorData = await agent1Response.json();
        throw new Error(errorData.error || "Agent 1 failed");
      }

      const agent1Data: Agent1Response = await agent1Response.json();
      logAgentCost("Agent 1: Claims & Excerpts Extractor", agent1Data.metadata);
      cumulativeCost += agent1Data.metadata.cost;

      setPipelineState((prev) => ({
        ...prev,
        agent1Result: agent1Data,
        totalCost: cumulativeCost,
      }));

      setCanResume(true);
      sessionStorage.setItem('pausedPipelineState', JSON.stringify({
        agent1Result: agent1Data,
        companyContext: { companyName, website, description },
        paperSource: useTextInput ? { type: 'text', paperText } : { type: 'pdf', pdfFileName, pdfBase64 },
        timestamp: Date.now(),
      }));

      setPipelineState((prev) => ({ ...prev, currentAgent: 2 }));
      console.log("Starting Agent 2: Strategic Context + Product Analyzer");

      const agent2Response = await fetch("/api/agent2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claims: agent1Data.claims,
          excerpts: agent1Data.claims.key_excerpts,
          companyContext: {
            companyName,
            website,
            description,
          },
        }),
        signal: pipelineAbortRef.current.signal,
      });

      if (!agent2Response.ok) {
        const errorData = await agent2Response.json();
        throw new Error(errorData.error || "Agent 2 failed");
      }

      const reader = agent2Response.body?.getReader();
      if (!reader) {
        throw new Error("No response body from Agent 2");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let strategic = null;
      let metadata = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            if (data.type === "section") {
              setCurrentSection(data.section);
            } else if (data.type === "done") {
              strategic = data.strategic;
              metadata = data.metadata;
            } else if (data.type === "error") {
              throw new Error(data.error);
            }
          }
        }
      }

      if (!strategic || !metadata) {
        throw new Error("Agent 2 did not return complete results");
      }

      const agent2Data: Agent2Response = { strategic, metadata };
      logAgentCost("Agent 2: Strategic Context + Product Analyzer", agent2Data.metadata);
      cumulativeCost += agent2Data.metadata.cost;

      setPipelineState({
        currentAgent: null,
        startTime: pipelineState.startTime,
        agent1Result: agent1Data,
        agent2Result: agent2Data,
        totalCost: cumulativeCost,
        error: null,
      });

      setActiveTab('strategic');

      try {
        localStorage.setItem("total_cost", cumulativeCost.toString());
      } catch {
        console.warn("Could not save cost to localStorage");
      }

      const totalRunCost = agent1Data.metadata.cost + agent2Data.metadata.cost;
      const totalRunTime = agent1Data.metadata.duration + agent2Data.metadata.duration;

      addToHistory({
        analysisResult: "",
        filename: useTextInput ? extractPaperTitle(paperText) : pdfFileName,
        companyContext: { companyName, website, description },
        metadata: {
          claims: agent1Data.claims,
          strategic: agent2Data.strategic,
        },
        cost: totalRunCost,
        analysisTime: totalRunTime,
        tokens: {
          agent1: agent1Data.metadata.tokens,
          agent2: agent2Data.metadata.tokens,
          total: agent1Data.metadata.tokens.total + agent2Data.metadata.tokens.total,
        },
      });

      sessionStorage.removeItem('pausedPipelineState');
      setCanResume(false);

      console.log("=== Pipeline Complete ===");
      console.log(`Total cost: $${(cumulativeCost - pipelineState.totalCost).toFixed(4)}`);
      console.log(`Total time: ${Date.now() - (pipelineState.startTime || Date.now())}ms`);

      if (document.hidden) {
        setWasAwayDuringCompletion(true);
        document.title = "✓ Analysis Complete - Research PM";
      }

      const newRunsRemaining = Math.max(0, multiAgentRunsRemaining - 1);
      setMultiAgentRunsRemaining(newRunsRemaining);
      try {
        localStorage.setItem(RUNS_REMAINING_KEY, newRunsRemaining.toString());
      } catch {
        console.warn("Could not save runs remaining to localStorage");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError("Analysis paused. You can resume from where you left off.");
        setPipelineRunning(false);
        return;
      }

      console.error("Pipeline error:", err);
      const errorMessage = err instanceof Error ? err.message : "Pipeline failed";
      setPipelineState((prev) => ({
        ...prev,
        currentAgent: null,
        error: errorMessage,
        totalCost: cumulativeCost,
      }));
      setError(errorMessage);

      try {
        localStorage.setItem("total_cost", cumulativeCost.toString());
      } catch {
        console.warn("Could not save cost to localStorage");
      }
    } finally {
      setPipelineRunning(false);
    }
  }

  function retryPipeline() {
    runMultiAgentAnalysis();
  }

  function pausePipeline() {
    if (pipelineAbortRef.current && pipelineRunning) {
      pipelineAbortRef.current.abort();
      setPipelinePaused(true);
      setPipelineRunning(false);
    }
  }

  async function resumePipeline() {
    const savedStateStr = sessionStorage.getItem('pausedPipelineState');
    if (!savedStateStr) {
      setError("No paused analysis found to resume");
      return;
    }

    try {
      const savedState = JSON.parse(savedStateStr);
      const { agent1Result, companyContext } = savedState;

      setPipelineRunning(true);
      setPipelinePaused(false);
      setError("");
      setPipelineState({
        currentAgent: 2,
        startTime: Date.now(),
        agent1Result: agent1Result,
        agent2Result: null,
        totalCost: agent1Result.metadata.cost,
        error: null,
      });

      pipelineAbortRef.current = new AbortController();

      const keyExcerpts = agent1Result.claims.key_excerpts || [];

      const agent2Response = await fetch("/api/agent2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claims: agent1Result.claims,
          excerpts: keyExcerpts,
          companyContext: companyContext,
        }),
        signal: pipelineAbortRef.current.signal,
      });

      if (!agent2Response.ok) {
        throw new Error(`Agent 2 failed: ${agent2Response.statusText}`);
      }

      const reader = agent2Response.body?.getReader();
      if (!reader) {
        throw new Error("No response body from Agent 2");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let strategic = null;
      let metadata = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            if (data.type === "section") {
              setCurrentSection(data.section);
            } else if (data.type === "done") {
              strategic = data.strategic;
              metadata = data.metadata;
            } else if (data.type === "error") {
              throw new Error(data.error);
            }
          }
        }
      }

      if (!strategic || !metadata) {
        throw new Error("Agent 2 did not return complete results");
      }

      const agent2Data = { strategic, metadata };

      setPipelineState({
        currentAgent: null,
        startTime: null,
        agent1Result: agent1Result,
        agent2Result: agent2Data,
        totalCost: agent1Result.metadata.cost + agent2Data.metadata.cost,
        error: null,
      });

      sessionStorage.removeItem('pausedPipelineState');
      setCanResume(false);

      const paperTitle = savedState.paperSource.type === 'text'
        ? extractPaperTitle(savedState.paperSource.paperText)
        : savedState.paperSource.pdfFileName;

      addToHistory({
        analysisResult: "",
        filename: paperTitle,
        companyContext: companyContext,
        metadata: {
          claims: agent1Result.claims,
          strategic: agent2Data.strategic,
        },
        cost: agent1Result.metadata.cost + agent2Data.metadata.cost,
        analysisTime: agent1Result.metadata.duration + agent2Data.metadata.duration,
        tokens: {
          agent1: agent1Result.metadata.tokens,
          agent2: agent2Data.metadata.tokens,
          total: agent1Result.metadata.tokens.total + agent2Data.metadata.tokens.total,
        },
      });

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError("Analysis paused again");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to resume analysis");
    } finally {
      setPipelineRunning(false);
    }
  }

  function handleShare() {
    if (!analysis) return;

    const shareItem: SharedItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      filename: useTextInput ? extractPaperTitle(paperText) : pdfFileName,
      titlePreview: analysis.slice(0, 60).replace(/[#*\n]/g, " ").trim(),
      analysis,
      companyContext: { companyName, website, description },
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };

    try {
      const stored = localStorage.getItem(SHARED_KEY);
      const shared: SharedItem[] = stored ? JSON.parse(stored) : [];
      const valid = shared.filter((s) => s.expiresAt > Date.now());
      valid.push(shareItem);
      localStorage.setItem(SHARED_KEY, JSON.stringify(valid));

      const url = `${window.location.origin}/share/${shareItem.id}`;
      navigator.clipboard.writeText(url);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    } catch {
      setError("Failed to create share link");
    }
  }

  function exportMarkdown() {
    let content = "";
    let filename = "";

    if (activeTab === 'strategic' && pipelineState.agent2Result) {
      const agent2Data: Agent2Response = pipelineState.agent2Result;
      content = generateStrategicMarkdown(agent2Data.strategic);
      filename = `${(pdfFileName || "analysis").replace(/\.pdf$/, "")}-strategic-analysis.md`;
    } else if (activeTab === 'quick' && analysis) {
      content = analysis;
      filename = `${(pdfFileName || "analysis").replace(/\.pdf$/, "")}-quick-analysis.md`;
    } else {
      setError("No analysis to export");
      return;
    }

    const contextParts = [];
    if (companyName) contextParts.push(`Company: ${companyName}`);
    if (website) contextParts.push(`Website: ${website}`);
    if (description) contextParts.push(`Description: ${description}`);

    const markdown = `# Analysis: ${useTextInput ? extractPaperTitle(paperText) : pdfFileName}
${contextParts.length > 0 ? `Company Context: ${contextParts.join(", ")}` : ""}
Generated: ${formatDate(Date.now())}
Type: ${activeTab === 'strategic' ? 'Strategic Analysis' : 'Quick Analysis'}

---

${content}
`;

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  }

  function exportPdf() {
    setShowExportMenu(false);
    window.print();
  }

  const inputClassName =
    "w-full p-3 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:ring-2 focus:ring-amber-600 focus:border-transparent";

  // Suppress unused variable warnings for now
  void pipelinePaused;
  void pageVisible;

  return (
    <>
      <div className="min-h-screen bg-stone-100 dark:bg-stone-900">
        <div className="flex">
          {/* Main Content */}
          <main className="flex-1 py-12 px-4 lg:mr-[300px]">
            <div className="max-w-3xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">
                  Decoder
                </h1>
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="lg:hidden p-2 text-stone-600 dark:text-stone-400"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              <p className="text-stone-600 dark:text-stone-400 mb-8">
                Analyze AI research papers and extract product implications
              </p>

              <div className="space-y-6">
                {/* Company Context */}
                <CompanyContextForm
                  companyName={companyName}
                  website={website}
                  description={description}
                  isLoading={isLoading || pipelineRunning}
                  onCompanyNameChange={setCompanyName}
                  onWebsiteChange={setWebsite}
                  onDescriptionChange={setDescription}
                />

                {/* Paper Input */}
                <div className="p-4 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">Research Paper</h2>
                    <button
                      onClick={() => { setUseTextInput(!useTextInput); setError(""); }}
                      className="text-sm text-[#D97757] hover:text-[#C4684A] font-medium"
                      disabled={isLoading || pipelineRunning}
                    >
                      {useTextInput ? "Upload PDF instead" : "Use text instead"}
                    </button>
                  </div>

                  {useTextInput ? (
                    <textarea
                      value={paperText}
                      onChange={(e) => setPaperText(e.target.value)}
                      placeholder="Paste the full text or abstract of a research paper here..."
                      className={`${inputClassName} h-48 resize-y text-sm`}
                      disabled={isLoading || pipelineRunning}
                    />
                  ) : (
                    <FileDropzone
                      pdfFileName={pdfFileName}
                      isDragging={isDragging}
                      isLoading={isLoading || pipelineRunning}
                      onFileSelect={handleFileSelect}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClear={clearPdf}
                    />
                  )}
                </div>

                {/* Analyze Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleAnalyze()}
                    disabled={isLoading || pipelineRunning}
                    className="flex-1 sm:flex-none px-6 py-3 bg-[#D97757] text-white font-medium rounded-lg hover:bg-[#C4684A] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Analyzing..." : "Quick Analysis"}
                  </button>
                  <button
                    onClick={runMultiAgentAnalysis}
                    disabled={isLoading || pipelineRunning || multiAgentRunsRemaining <= 0}
                    className="flex-1 sm:flex-none px-6 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-medium rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pipelineRunning
                      ? "Running Pipeline..."
                      : multiAgentRunsRemaining > 0
                      ? `Deeper Analysis (${multiAgentRunsRemaining} remaining)`
                      : "Deeper Analysis (limit reached)"}
                  </button>
                </div>

                {/* Loading State */}
                {isLoading && currentSection && (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <LoadingSpinner />
                    <span className="text-stone-700 dark:text-amber-100 font-medium">{currentSection}</span>
                  </div>
                )}

                {/* Pipeline Status (Running / Paused) */}
                <PipelineStatus
                  pipelineRunning={pipelineRunning}
                  currentAgent={pipelineState.currentAgent}
                  elapsedTime={elapsedTime}
                  canResume={canResume}
                  onPause={pausePipeline}
                  onResume={resumePipeline}
                />

                {/* Completion Banner */}
                <CompletionBanner
                  show={wasAwayDuringCompletion}
                  onDismiss={() => setWasAwayDuringCompletion(false)}
                />

                {/* Error Display */}
                {error && !isLoading && !pipelineRunning && (
                  <ErrorDisplay
                    error={error}
                    isPipelineError={!!pipelineState.error}
                    retryCount={retryCount}
                    onRetry={pipelineState.error ? retryPipeline : handleRetry}
                  />
                )}

                {/* Tab Switcher */}
                {(analysis || pipelineState.agent2Result) && !pipelineRunning && (
                  <div className="flex gap-2 border-b border-stone-200 dark:border-stone-700">
                    {analysis && (
                      <button
                        onClick={() => setActiveTab('quick')}
                        className={`px-4 py-3 font-medium border-b-2 ${
                          activeTab === 'quick'
                            ? 'border-amber-600 text-amber-600'
                            : 'border-transparent text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        Quick Analysis
                      </button>
                    )}
                    {pipelineState.agent2Result && (
                      <button
                        onClick={() => setActiveTab('strategic')}
                        className={`px-4 py-3 font-medium border-b-2 ${
                          activeTab === 'strategic'
                            ? 'border-amber-600 text-amber-600'
                            : 'border-transparent text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        Strategic Analysis
                      </button>
                    )}
                  </div>
                )}

                {/* Quick Analysis View */}
                {activeTab === 'quick' && analysis && (
                  <QuickAnalysisView
                    analysis={analysis}
                    showExportMenu={showExportMenu}
                    onToggleExportMenu={() => setShowExportMenu(!showExportMenu)}
                    onShare={handleShare}
                    onExportMarkdown={exportMarkdown}
                    onExportPdf={exportPdf}
                  />
                )}

                {/* Strategic Analysis View */}
                {activeTab === 'strategic' && pipelineState.agent1Result && pipelineState.agent2Result && !pipelineRunning && (
                  <StrategicAnalysisView
                    agent1Result={pipelineState.agent1Result}
                    agent2Result={pipelineState.agent2Result}
                    expandedSections={expandedSections}
                    onToggleSection={(section) =>
                      setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
                    }
                  />
                )}
              </div>
            </div>
          </main>

          {/* History Sidebar (Desktop + Mobile) */}
          <HistorySidebar
            history={history}
            recentHistory={recentHistory}
            showMobile={showMobileSidebar}
            onLoadItem={selectHistoryItem}
            onViewAll={() => setShowHistoryModal(true)}
            onClear={() => setShowClearConfirm(true)}
            onCloseMobile={() => setShowMobileSidebar(false)}
          />
        </div>

        {/* History Modal */}
        <HistoryModal
          show={showHistoryModal}
          history={history}
          filteredHistory={filteredHistory}
          search={historySearch}
          onSearchChange={setHistorySearch}
          onLoadItem={selectHistoryItem}
          onClose={() => setShowHistoryModal(false)}
        />

        {/* Clear History Confirmation */}
        <ConfirmModal
          show={showClearConfirm}
          title="Clear History?"
          message="Delete all saved analyses? This cannot be undone."
          confirmLabel="Delete All"
          confirmVariant="danger"
          onConfirm={clearHistory}
          onCancel={() => setShowClearConfirm(false)}
        />

        {/* Clear Analysis Confirmation */}
        <ConfirmModal
          show={showClearConfirmAnalysis}
          title="Start New Analysis?"
          message={`You have existing results. Starting a new ${pendingAnalysisType} analysis will clear them. Continue?`}
          confirmLabel="Clear & Continue"
          confirmVariant="warning"
          onConfirm={() => {
            setShowClearConfirmAnalysis(false);
            if (pendingAnalysisType === 'quick') {
              handleAnalyze(true);
            } else if (pendingAnalysisType === 'strategic') {
              setAnalysis("");
              setPipelineState({
                currentAgent: null,
                startTime: null,
                agent1Result: null,
                agent2Result: null,
                totalCost: pipelineState.totalCost,
                error: null,
              });
              runMultiAgentAnalysisConfirmed();
            }
          }}
          onCancel={() => {
            setShowClearConfirmAnalysis(false);
            setPendingAnalysisType(null);
          }}
        />

        {/* Share Toast */}
        <ShareToast show={showShareToast} />
      </div>
    </>
  );
}
