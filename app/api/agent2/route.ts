import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { rateLimiter, getClientIP } from "@/lib/rate-limiter";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { claims, excerpts, companyContext } = await request.json();

    if (!claims || !excerpts || !companyContext || !companyContext.companyName) {
      return new Response(
        JSON.stringify({ error: "Claims, excerpts, and company context are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Rate limiting check
    const clientIP = getClientIP(request);
    const rateLimit = await rateLimiter.checkLimit(clientIP, {
      maxRequests: 5, // Stricter for multi-agent (uses Sonnet 4.5)
      windowMs: 60 * 60 * 1000, // 1 hour
      costCap: 5, // $5 daily cap
    });

    if (!rateLimit.success) {
      return new Response(
        JSON.stringify({
          error: rateLimit.error || "Rate limit exceeded",
          resetAt: new Date(rateLimit.resetAt).toISOString(),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": new Date(rateLimit.resetAt).toISOString(),
          },
        }
      );
    }

    const companyName = companyContext.companyName;
    const website = companyContext.website || '';
    const description = companyContext.description || '';

    const prompt = `You are a strategic product advisor conducting executive briefing for ${companyName}.

**CONTEXT**
Company: ${companyName}
${website ? `Website: ${website}` : ''}
${description ? `Business: ${description}` : ''}

We're evaluating a research paper to determine if it presents a viable product opportunity.

**RESEARCH FINDINGS**

Technical Claims:
${JSON.stringify(claims, null, 2)}

Key Excerpts from Paper:
${JSON.stringify(excerpts, null, 2)}

**YOUR MISSION**

Deliver a concise executive briefing answering three strategic questions:

1. **Should ${companyName} build this?**
   - Does this align with our capabilities? (web search: ${companyName}${website ? ` site:${website}` : ''} + key technology)
   - What's our capability overlap percentage?
   - What critical gaps would we need to fill?
   - Bottom line: HIGH/MEDIUM/LOW strategic fit

2. **What's the market opportunity?**
   - Who else is building this? (web search: 2-3 top competitors + technology status)
   - Are we early, on-time, late, or entering a saturated market?
   - How can we differentiate if we enter?

3. **What would it take to ship?**
   - Identify 2-3 concrete product ideas with clear target customers
   - Assess build complexity: team size, timeline, infrastructure
   - Identify deal-breaker risks: technical, market, regulatory

**CONSTRAINTS**
- Maximum 2 web searches (1 for ${companyName}, 1 for top competitor)
- Focus on actionable insights, not theoretical analysis
- Use plain language - target audience is PMs and designers, not engineers

**OUTPUT FORMAT**

Return valid JSON with this exact structure:

{
  "internal_assessment": {
    "existing_capabilities": "What ${companyName} already has in place",
    "capability_overlap_pct": 0-100,
    "strategic_fit": "HIGH|MEDIUM|LOW",
    "strategic_fit_reasoning": "Bottom-line: why this rating",
    "resource_gap": "Critical missing pieces we'd need to build/acquire"
  },
  "competitive_landscape": {
    "competitors_found": ["Company names"],
    "competitor_details": [
      {
        "company": "Name",
        "status": "What they've shipped or announced",
        "timeline": "When",
        "sources": ["URLs"]
      }
    ],
    "market_timing": "EARLY|ON_TIME|LATE|SATURATED",
    "market_timing_reasoning": "Why this timing assessment",
    "differentiation_opportunities": ["How we could stand out"]
  },
  "product_implications": {
    "opportunities": [
      {
        "product_idea": "Specific product concept",
        "target_customer": "Who would buy this",
        "value_proposition": "Why they'd pay for it",
        "differentiation": "Our unique angle"
      }
    ],
    "build_assessment": {
      "technical_complexity": "LOW|MEDIUM|HIGH",
      "estimated_timeline": "Realistic shipping timeline",
      "team_requirements": "Team composition and size",
      "infrastructure_needs": "Systems, platforms, tools required",
      "key_challenges": ["Top 3-5 obstacles to shipping"]
    },
    "market_fit": {
      "target_segment": "Most promising customer segment",
      "competitive_positioning": "How we'd position vs. competitors",
      "pricing_strategy": "How we'd charge",
      "adoption_barriers": ["Why customers might not buy"]
    },
    "risks": {
      "technical": ["Engineering risks that could sink this"],
      "market": ["Business risks to consider"],
      "regulatory": ["Legal/compliance concerns if any"]
    }
  }
}

Be direct. Skip preamble. Lead with implications, not methodology.`;

    const startTime = Date.now();
    const encoder = new TextEncoder();

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial progress
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "section", section: "Starting strategic analysis..." })}\n\n`
            )
          );

          // Use streaming API
          const messageStream = anthropic.messages.stream({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 5000,
            tools: [
              {
                type: "web_search_20250305" as const,
                name: "web_search",
              },
            ],
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          });

          let fullText = "";
          const sentSections = new Set<string>();
          const sectionMap: Record<string, string> = {
            "internal_assessment": "Analyzing internal capabilities...",
            "competitive_landscape": "Researching competitive landscape...",
            "product_implications": "Generating product recommendations...",
          };

          for await (const event of messageStream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              const text = event.delta.text;
              fullText += text;

              // Detect section transitions in JSON output
              for (const [marker, status] of Object.entries(sectionMap)) {
                if (fullText.includes(`"${marker}"`) && !sentSections.has(marker)) {
                  sentSections.add(marker);
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "section", section: status })}\n\n`
                    )
                  );
                }
              }

              // Send text chunks
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", text })}\n\n`
                )
              );
            }
          }

          const endTime = Date.now();
          const duration = endTime - startTime;

          // Parse final JSON
          let strategic;
          try {
            // First, try to extract JSON from markdown code blocks
            const codeBlockMatch = fullText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (codeBlockMatch) {
              strategic = JSON.parse(codeBlockMatch[1].trim());
            } else {
              // Try to find JSON object by looking for the first { and last }
              const firstBrace = fullText.indexOf('{');
              const lastBrace = fullText.lastIndexOf('}');
              if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                const jsonText = fullText.substring(firstBrace, lastBrace + 1);
                strategic = JSON.parse(jsonText);
              } else {
                // Last resort: try parsing the entire response
                strategic = JSON.parse(fullText.trim());
              }
            }
          } catch (parseError) {
            console.error("Failed to parse Agent 2 response:", fullText.substring(0, 500));
            throw new Error(`Failed to parse strategic analysis JSON from response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
          }

          // Validate the structure
          if (
            !strategic.internal_assessment ||
            !strategic.competitive_landscape ||
            !strategic.product_implications
          ) {
            throw new Error("Invalid strategic analysis structure");
          }

          // Get token usage from stream
          const finalMessage = await messageStream.finalMessage();
          const inputTokens = finalMessage.usage.input_tokens;
          const outputTokens = finalMessage.usage.output_tokens;
          const inputCost = (inputTokens / 1000000) * 3; // $3 per million input tokens
          const outputCost = (outputTokens / 1000000) * 15; // $15 per million output tokens
          const totalCost = inputCost + outputCost;

          // Track cost
          await rateLimiter.trackCost(totalCost);

          const metadata = {
            duration,
            tokens: {
              input: inputTokens,
              output: outputTokens,
              total: inputTokens + outputTokens,
            },
            cost: totalCost,
          };

          // Send completion with parsed result
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", strategic, metadata })}\n\n`
            )
          );
          controller.close();
        } catch (error) {
          console.error("Agent 2 streaming error:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Failed to analyze strategic context";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: errorMessage })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
      },
    });
  } catch (error) {
    console.error("Agent 2 error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to analyze strategic context";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
