import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { rateLimiter, getClientIP } from "@/lib/rate-limiter";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { paperText, pdfBase64 } = await request.json();

    if (!paperText && !pdfBase64) {
      return new Response(
        JSON.stringify({ error: "Either paper text or PDF is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Rate limiting check
    const clientIP = getClientIP(request);
    const rateLimit = await rateLimiter.checkLimit(clientIP, {
      maxRequests: 10, // 10 per hour for agent1 (cheaper than agent2)
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

    const prompt = `You are analyzing a research paper to extract specific claims and key excerpts.

Read this paper and identify:

1. CLAIMS:
   - Technical claims (novel techniques, architectures, approaches)
   - Performance claims (benchmarks, metrics, comparisons)
   - Resource requirements (compute, data, infrastructure needed)
   - Capability claims (what the system can/cannot do)

2. KEY EXCERPTS:
   Extract 3-5 key text excerpts (each 300-500 words) that capture:
   - Abstract/introduction (research overview)
   - Main technical approach
   - Key results/findings
   - Conclusions and implications

For excerpts: copy relevant text verbatim, these will be used by other agents.

Output as valid JSON only (no markdown, no preamble):
{
  "technical_claims": ["claim1", "claim2"],
  "performance_claims": ["claim1", "claim2"],
  "resource_requirements": ["req1", "req2"],
  "capability_claims": ["claim1", "claim2"],
  "key_excerpts": [
    {
      "section": "Abstract",
      "text": "verbatim excerpt text..."
    },
    {
      "section": "Main Approach",
      "text": "verbatim excerpt text..."
    }
  ]
}

${paperText ? `Paper: ${paperText}` : 'Paper: [See attached PDF document]'}`;

    const startTime = Date.now();

    // Build message content based on input type
    const messageContent: Array<any> = [];

    if (pdfBase64) {
      // PDF input - use document type
      messageContent.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: pdfBase64,
        },
      });
      messageContent.push({
        type: "text",
        text: prompt,
      });
    } else {
      // Text input - embed in prompt
      messageContent.push({
        type: "text",
        text: prompt,
      });
    }

    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 6000,
      messages: [
        {
          role: "user",
          content: messageContent,
        },
      ],
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Extract text from the response
    const responseText = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("");

    // Try to parse JSON from the response
    // The response might have markdown code blocks or preamble
    let claims;
    try {
      // First, try to extract JSON from markdown code blocks
      const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        claims = JSON.parse(codeBlockMatch[1].trim());
      } else {
        // Try to find JSON object by looking for the first { and last }
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonText = responseText.substring(firstBrace, lastBrace + 1);
          claims = JSON.parse(jsonText);
        } else {
          // Last resort: try parsing the entire response
          claims = JSON.parse(responseText.trim());
        }
      }
    } catch (parseError) {
      console.error("Failed to parse Agent 1 response:", responseText.substring(0, 500));
      throw new Error(`Failed to parse claims JSON from response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // Validate the structure
    if (
      !claims.technical_claims ||
      !claims.performance_claims ||
      !claims.resource_requirements ||
      !claims.capability_claims ||
      !claims.key_excerpts
    ) {
      throw new Error("Invalid claims structure");
    }

    // Calculate cost (approximate)
    const inputTokens = message.usage.input_tokens;
    const outputTokens = message.usage.output_tokens;
    const inputCost = (inputTokens / 1000000) * 0.8; // $0.80 per million input tokens (Haiku)
    const outputCost = (outputTokens / 1000000) * 4; // $4 per million output tokens (Haiku)
    const totalCost = inputCost + outputCost;

    // Track cost
    await rateLimiter.trackCost(totalCost);

    return new Response(
      JSON.stringify({
        claims,
        metadata: {
          duration,
          tokens: {
            input: inputTokens,
            output: outputTokens,
            total: inputTokens + outputTokens,
          },
          cost: totalCost,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error("Agent 1 error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to extract claims";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
