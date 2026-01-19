import { Agent1Response, Agent2Response } from "../../types";

interface StrategicAnalysisViewProps {
  agent1Result: Agent1Response;
  agent2Result: Agent2Response;
  expandedSections: {
    agent1: boolean;
    agent2: boolean;
    details: boolean;
  };
  onToggleSection: (section: "agent1" | "agent2" | "details") => void;
}

function getStrategicFitClass(fit: "HIGH" | "MEDIUM" | "LOW") {
  switch (fit) {
    case "HIGH":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "LOW":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  }
}

function getComplexityClass(complexity: "LOW" | "MEDIUM" | "HIGH") {
  switch (complexity) {
    case "LOW":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "HIGH":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  }
}

function getMarketTimingClass(timing: "EARLY" | "ON_TIME" | "LATE" | "SATURATED") {
  switch (timing) {
    case "EARLY":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "ON_TIME":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "LATE":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "SATURATED":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  }
}

export function StrategicAnalysisView({
  agent1Result,
  agent2Result,
  expandedSections,
  onToggleSection,
}: StrategicAnalysisViewProps) {
  const strategic = agent2Result.strategic;

  return (
    <div className="space-y-6 no-print">
      {/* Main Analysis */}
      <div className="p-6 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-6">
          Product Management Analysis
        </h2>

        {/* Executive Summary */}
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 rounded-r-lg">
          <h3 className="text-lg font-bold text-stone-900 dark:text-blue-100 mb-2">
            Executive Summary
          </h3>
          <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
            Strategic fit for this research is{" "}
            <span className="font-semibold">
              {strategic.internal_assessment.strategic_fit}
            </span>{" "}
            with {strategic.internal_assessment.capability_overlap_pct}% existing
            capability overlap. Market timing is{" "}
            <span className="font-semibold">
              {strategic.competitive_landscape.market_timing}
            </span>
            .
            {strategic.product_implications.opportunities.length > 0 && (
              <>
                {" "}
                Top opportunity:{" "}
                {strategic.product_implications.opportunities[0].product_idea}.
              </>
            )}
          </p>
        </div>

        {/* Product Opportunities */}
        {strategic.product_implications.opportunities.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-600 rounded-r-lg">
            <h3 className="text-lg font-bold text-stone-900 dark:text-amber-100 mb-3">
              Product Opportunities
            </h3>
            <div className="space-y-4">
              {strategic.product_implications.opportunities.map((opp, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white dark:bg-stone-800 rounded-lg"
                >
                  <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">
                    {idx + 1}. {opp.product_idea}
                  </h4>
                  <div className="space-y-1 text-sm text-stone-700 dark:text-stone-300">
                    <p>
                      <span className="font-medium">Target:</span>{" "}
                      {opp.target_customer}
                    </p>
                    <p>
                      <span className="font-medium">Value:</span>{" "}
                      {opp.value_proposition}
                    </p>
                    <p>
                      <span className="font-medium">Differentiation:</span>{" "}
                      {opp.differentiation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Build Assessment */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-3">
            Build Assessment
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                Complexity
              </p>
              <span
                className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded ${getComplexityClass(
                  strategic.product_implications.build_assessment
                    .technical_complexity
                )}`}
              >
                {
                  strategic.product_implications.build_assessment
                    .technical_complexity
                }
              </span>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                Timeline
              </p>
              <p className="text-sm text-stone-700 dark:text-stone-300 mt-1">
                {strategic.product_implications.build_assessment.estimated_timeline}
              </p>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg sm:col-span-2">
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-1">
                Infrastructure
              </p>
              <p className="text-sm text-stone-700 dark:text-stone-300">
                {strategic.product_implications.build_assessment.infrastructure_needs}
              </p>
            </div>
            {strategic.product_implications.build_assessment.key_challenges.length >
              0 && (
              <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg sm:col-span-2">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-1">
                  Key Challenges
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-stone-700 dark:text-stone-300">
                  {strategic.product_implications.build_assessment.key_challenges.map(
                    (c, i) => (
                      <li key={i}>{c}</li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Market Positioning */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-3">
            Market Positioning
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-1">
                Target Segment
              </p>
              <p className="text-sm text-stone-700 dark:text-stone-300">
                {strategic.product_implications.market_fit.target_segment}
              </p>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-1">
                Competitive Positioning
              </p>
              <p className="text-sm text-stone-700 dark:text-stone-300">
                {strategic.product_implications.market_fit.competitive_positioning}
              </p>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-1">
                Pricing Strategy
              </p>
              <p className="text-sm text-stone-700 dark:text-stone-300">
                {strategic.product_implications.market_fit.pricing_strategy}
              </p>
            </div>
            {strategic.product_implications.market_fit.adoption_barriers.length >
              0 && (
              <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-1">
                  Adoption Barriers
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-stone-700 dark:text-stone-300">
                  {strategic.product_implications.market_fit.adoption_barriers.map(
                    (b, i) => (
                      <li key={i}>{b}</li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Strategic Context */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-3">
            Strategic Context
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  Strategic Fit
                </p>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded ${getStrategicFitClass(
                    strategic.internal_assessment.strategic_fit
                  )}`}
                >
                  {strategic.internal_assessment.strategic_fit}
                </span>
              </div>
              <p className="text-sm text-stone-700 dark:text-stone-300">
                {strategic.internal_assessment.strategic_fit_reasoning}
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">
                {strategic.internal_assessment.capability_overlap_pct}% capability
                overlap
              </p>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-1">
                Resource Gap
              </p>
              <p className="text-sm text-stone-700 dark:text-stone-300">
                {strategic.internal_assessment.resource_gap}
              </p>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  Market Timing
                </p>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded ${getMarketTimingClass(
                    strategic.competitive_landscape.market_timing
                  )}`}
                >
                  {strategic.competitive_landscape.market_timing}
                </span>
              </div>
              <p className="text-sm text-stone-700 dark:text-stone-300">
                {strategic.competitive_landscape.market_timing_reasoning}
              </p>
            </div>
            {strategic.competitive_landscape.differentiation_opportunities.length >
              0 && (
              <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-1">
                  Differentiation Opportunities
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-stone-700 dark:text-stone-300">
                  {strategic.competitive_landscape.differentiation_opportunities.map(
                    (d, i) => (
                      <li key={i}>{d}</li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-3">
            Risk Assessment
          </h3>
          <div className="space-y-3">
            {strategic.product_implications.risks.technical.length > 0 && (
              <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-1">
                  Technical Risks
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-stone-700 dark:text-stone-300">
                  {strategic.product_implications.risks.technical.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            {strategic.product_implications.risks.market.length > 0 && (
              <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-1">
                  Market Risks
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-stone-700 dark:text-stone-300">
                  {strategic.product_implications.risks.market.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            {strategic.product_implications.risks.regulatory.length > 0 && (
              <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-1">
                  Regulatory Risks
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-stone-700 dark:text-stone-300">
                  {strategic.product_implications.risks.regulatory.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Competitive Landscape */}
        {strategic.competitive_landscape.competitor_details.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-3">
              Competitive Landscape
            </h3>
            <div className="space-y-2">
              {strategic.competitive_landscape.competitor_details.map(
                (comp, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg"
                  >
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {comp.company}
                    </h4>
                    <p className="text-xs text-stone-700 dark:text-stone-300 mt-1">
                      <span className="font-medium">Status:</span> {comp.status}
                      {comp.timeline && (
                        <>
                          {" "}
                          • <span className="font-medium">Timeline:</span>{" "}
                          {comp.timeline}
                        </>
                      )}
                    </p>
                    {comp.sources.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          Sources:
                        </span>
                        {comp.sources.map((source, i) => (
                          <a
                            key={i}
                            href={source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            [{i + 1}]
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Analysis Metadata with Token Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg">
        {/* Total Summary */}
        <div className="text-center">
          <div className="text-sm text-stone-500 dark:text-stone-400">
            Total Cost
          </div>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            $
            {(
              agent1Result.metadata.cost + agent2Result.metadata.cost
            ).toFixed(4)}
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-stone-500 dark:text-stone-400">
            Total Time
          </div>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {(
              (agent1Result.metadata.duration + agent2Result.metadata.duration) /
              1000
            ).toFixed(1)}
            s
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-stone-500 dark:text-stone-400">
            Total Tokens
          </div>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {(
              agent1Result.metadata.tokens.total +
              agent2Result.metadata.tokens.total
            ).toLocaleString()}
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="col-span-1 md:col-span-3 border-t border-stone-200 dark:border-stone-700 pt-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Agent 1 Details */}
            <div className="space-y-1">
              <div className="font-medium text-stone-700 dark:text-stone-300">
                Agent 1 (Claims Extraction)
              </div>
              <div className="text-stone-600 dark:text-stone-400">
                <span className="font-mono">
                  {agent1Result.metadata.tokens.input.toLocaleString()}
                </span>{" "}
                in •
                <span className="font-mono ml-1">
                  {agent1Result.metadata.tokens.output.toLocaleString()}
                </span>{" "}
                out
              </div>
              <div className="text-stone-500 dark:text-stone-500">
                ${agent1Result.metadata.cost.toFixed(4)} •{" "}
                {(agent1Result.metadata.duration / 1000).toFixed(1)}s
              </div>
            </div>

            {/* Agent 2 Details */}
            <div className="space-y-1">
              <div className="font-medium text-stone-700 dark:text-stone-300">
                Agent 2 (Strategic Analysis)
              </div>
              <div className="text-stone-600 dark:text-stone-400">
                <span className="font-mono">
                  {agent2Result.metadata.tokens.input.toLocaleString()}
                </span>{" "}
                in •
                <span className="font-mono ml-1">
                  {agent2Result.metadata.tokens.output.toLocaleString()}
                </span>{" "}
                out
              </div>
              <div className="text-stone-500 dark:text-stone-500">
                ${agent2Result.metadata.cost.toFixed(4)} •{" "}
                {(agent2Result.metadata.duration / 1000).toFixed(1)}s
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Details Section */}
      <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
        <button
          onClick={() => onToggleSection("details")}
          className="w-full p-4 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg
              className={`h-5 w-5 text-stone-600 dark:text-stone-400 transition-transform ${
                expandedSections.details ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              View Analysis Details
            </h3>
          </div>
          <span className="text-sm text-stone-500 dark:text-stone-400">
            {expandedSections.details ? "Hide" : "Show"} agent outputs
          </span>
        </button>

        {expandedSections.details && (
          <div className="border-t border-stone-200 dark:border-stone-700 p-6 space-y-6">
            {/* Agent 1: Claims + Excerpts */}
            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-3 uppercase tracking-wide">
                Agent 1: Claims + Key Excerpts
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
                  <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
                    Technical Claims ({agent1Result.claims.technical_claims.length})
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-stone-600 dark:text-stone-400">
                    {agent1Result.claims.technical_claims.map((claim, idx) => (
                      <li key={idx}>{claim}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
                  <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
                    Performance Claims (
                    {agent1Result.claims.performance_claims.length})
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-stone-600 dark:text-stone-400">
                    {agent1Result.claims.performance_claims.map((claim, idx) => (
                      <li key={idx}>{claim}</li>
                    ))}
                  </ul>
                </div>
                {agent1Result.claims.key_excerpts &&
                  agent1Result.claims.key_excerpts.length > 0 && (
                    <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
                      <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
                        Key Excerpts ({agent1Result.claims.key_excerpts.length})
                      </p>
                      <div className="space-y-2">
                        {agent1Result.claims.key_excerpts
                          .slice(0, 2)
                          .map((excerpt, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-medium text-stone-700 dark:text-stone-300">
                                {excerpt.section}:
                              </span>
                              <span className="text-stone-600 dark:text-stone-400">
                                {" "}
                                {excerpt.text.substring(0, 100)}...
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Agent 2: Strategic & Product Analysis */}
            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-3 uppercase tracking-wide">
                Agent 2: Strategic & Product Analysis
              </h4>
              <div className="space-y-2">
                <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
                  <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Strategic Fit
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded ${getStrategicFitClass(
                        strategic.internal_assessment.strategic_fit
                      )}`}
                    >
                      {strategic.internal_assessment.strategic_fit}
                    </span>
                    <span className="text-xs text-stone-600 dark:text-stone-400">
                      {strategic.internal_assessment.capability_overlap_pct}%
                      capability overlap
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
                  <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Market Timing
                  </p>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded ${getMarketTimingClass(
                      strategic.competitive_landscape.market_timing
                    )}`}
                  >
                    {strategic.competitive_landscape.market_timing}
                  </span>
                </div>
                {strategic.product_implications.opportunities.length > 0 && (
                  <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
                    <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Top Product Opportunity
                    </p>
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      {strategic.product_implications.opportunities[0].product_idea}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
