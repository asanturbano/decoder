export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function extractPaperTitle(paperText: string): string {
  if (!paperText || !paperText.trim()) return "Untitled Paper";

  // Try to find markdown heading
  const headingMatch = paperText.match(/^#\s+(.+)$/m);
  if (headingMatch && headingMatch[1]) {
    return headingMatch[1].trim().slice(0, 60);
  }

  // Fall back to first substantial line
  const lines = paperText.split('\n').map(l => l.trim()).filter(l => l.length > 10);
  if (lines.length > 0) {
    return lines[0].replace(/[#*]/g, '').trim().slice(0, 60);
  }

  return "Untitled Paper";
}

/**
 * Remove references, bibliography, appendix, and acknowledgments from paper text
 */
export function cleanPaper(paperText: string): string {
  let cleaned = paperText;

  // Remove references section (case insensitive)
  cleaned = cleaned.split(/\n##?\s*References/i)[0];

  // Remove bibliography
  cleaned = cleaned.split(/\n##?\s*Bibliography/i)[0];

  // Remove appendix
  cleaned = cleaned.split(/\n##?\s*Appendix/i)[0];

  // Remove acknowledgments
  cleaned = cleaned.split(/\n##?\s*Acknowledgments/i)[0];

  return cleaned.trim();
}
