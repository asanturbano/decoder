export interface HistoryItem {
  id: string;
  timestamp: number;
  filename: string;
  titlePreview: string;
  analysis: string;
  companyContext: {
    companyName?: string;
    website?: string;
    description?: string;
  };
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

export interface SharedItem extends HistoryItem {
  expiresAt: number;
}

export interface KeyExcerpt {
  section: string;
  text: string;
}

export interface Agent1Result {
  technical_claims: string[];
  performance_claims: string[];
  resource_requirements: string[];
  capability_claims: string[];
  key_excerpts: KeyExcerpt[];
}

export interface Agent1Response {
  claims: Agent1Result;
  metadata: {
    duration: number;
    tokens: {
      input: number;
      output: number;
      total: number;
    };
    cost: number;
  };
}

export interface Agent2Result {
  internal_assessment: {
    existing_capabilities: string;
    capability_overlap_pct: number;
    strategic_fit: "HIGH" | "MEDIUM" | "LOW";
    strategic_fit_reasoning: string;
    resource_gap: string;
  };
  competitive_landscape: {
    competitors_found: string[];
    competitor_details: Array<{
      company: string;
      status: string;
      timeline: string;
      sources: string[];
    }>;
    market_timing: "EARLY" | "ON_TIME" | "LATE" | "SATURATED";
    market_timing_reasoning: string;
    differentiation_opportunities: string[];
  };
  product_implications: {
    opportunities: Array<{
      product_idea: string;
      target_customer: string;
      value_proposition: string;
      differentiation: string;
    }>;
    build_assessment: {
      technical_complexity: "LOW" | "MEDIUM" | "HIGH";
      estimated_timeline: string;
      team_requirements: string;
      infrastructure_needs: string;
      key_challenges: string[];
    };
    market_fit: {
      target_segment: string;
      competitive_positioning: string;
      pricing_strategy: string;
      adoption_barriers: string[];
    };
    risks: {
      technical: string[];
      market: string[];
      regulatory: string[];
    };
  };
}

export interface Agent2Response {
  strategic: Agent2Result;
  metadata: {
    duration: number;
    tokens: {
      input: number;
      output: number;
      total: number;
    };
    cost: number;
  };
}

export interface PipelineState {
  currentAgent: number | null;
  startTime: number | null;
  agent1Result: Agent1Response | null;
  agent2Result: Agent2Response | null;
  totalCost: number;
  error: string | null;
}
