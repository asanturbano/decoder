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

export function logAgentCost(
  agentName: string,
  metadata: {
    tokens: { input: number; output: number; total: number };
    cost: number;
    duration: number;
  }
): number {
  console.log(`=== ${agentName} ===`);
  console.log(`Input tokens: ${metadata.tokens.input}`);
  console.log(`Output tokens: ${metadata.tokens.output}`);
  console.log(`Cost: $${metadata.cost.toFixed(4)}`);
  console.log(`Duration: ${metadata.duration}ms`);
  console.log("");
  return metadata.cost;
}

import type { Agent2Result } from "./types";

export function generateStrategicMarkdown(strategic: Agent2Result): string {
  const { internal_assessment, competitive_landscape, product_implications } = strategic;

  return `# Executive Summary

## Strategic Fit: ${internal_assessment.strategic_fit}

${internal_assessment.strategic_fit_reasoning}

**Capability Overlap:** ${internal_assessment.capability_overlap_pct}% match with current capabilities

---

## Key Findings

### Internal Assessment

**Existing Capabilities:**
${internal_assessment.existing_capabilities}

**Resource Gap:**
${internal_assessment.resource_gap}

---

### Market Position

**Market Timing:** ${competitive_landscape.market_timing}

${competitive_landscape.market_timing_reasoning}

**Competitors Identified:**
${competitive_landscape.competitors_found.map(c => `- ${c}`).join('\n')}

**Differentiation Opportunities:**
${competitive_landscape.differentiation_opportunities.map(o => `- ${o}`).join('\n')}

---

## Product Opportunities

${product_implications.opportunities.map((opp, idx) => `
### ${idx + 1}. ${opp.product_idea}

- **Target Customer:** ${opp.target_customer}
- **Value Proposition:** ${opp.value_proposition}
- **Differentiation:** ${opp.differentiation}
`).join('\n')}

---

## Build Assessment

**Technical Complexity:** ${product_implications.build_assessment.technical_complexity}
**Estimated Timeline:** ${product_implications.build_assessment.estimated_timeline}

**Team Requirements:**
${product_implications.build_assessment.team_requirements}

**Infrastructure Needs:**
${product_implications.build_assessment.infrastructure_needs}

**Key Challenges:**
${product_implications.build_assessment.key_challenges.map(c => `- ${c}`).join('\n')}

---

## Market Fit Analysis

**Target Segment:** ${product_implications.market_fit.target_segment}

**Competitive Positioning:** ${product_implications.market_fit.competitive_positioning}

**Pricing Strategy:** ${product_implications.market_fit.pricing_strategy}

**Adoption Barriers:**
${product_implications.market_fit.adoption_barriers.map(b => `- ${b}`).join('\n')}

---

## Risk Assessment

### Technical Risks
${product_implications.risks.technical.map(r => `- ${r}`).join('\n')}

### Market Risks
${product_implications.risks.market.map(r => `- ${r}`).join('\n')}

${product_implications.risks.regulatory.length > 0 ? `### Regulatory Risks\n${product_implications.risks.regulatory.map(r => `- ${r}`).join('\n')}` : ''}

---

## Competitive Intelligence

${competitive_landscape.competitor_details.map(comp => `
### ${comp.company}
- **Status:** ${comp.status}
- **Timeline:** ${comp.timeline}
- **Sources:** ${comp.sources.join(', ')}
`).join('\n')}`;
}
