import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { rateLimiter, getClientIP } from "@/lib/rate-limiter";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const {
      paperText,
      pdfBase64,
      companyName,
      website,
      description,
    } = await request.json();

    // Require either paperText or pdfBase64
    if (!paperText && !pdfBase64) {
      return new Response(
        JSON.stringify({ error: "Paper text or PDF is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Rate limiting check
    const clientIP = getClientIP(request);
    const rateLimit = await rateLimiter.checkLimit(clientIP, {
      maxRequests: 10, // 10 per hour for analyze
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

    const hasContext = companyName || website || description;

    let contextSection = "";
    if (hasContext) {
      const contextParts = [];
      if (companyName) contextParts.push(`Company: ${companyName}`);
      if (website) contextParts.push(`Website: ${website}`);
      if (description) contextParts.push(`Description: ${description}`);

      contextSection = `\n\nWhen identifying product implications, consider this analysis is for:\n${contextParts.join("\n")}\n\nBe specific about how this research could apply to their specific product context and market.`;
    } else {
      contextSection =
        "\n\nProvide general product implications that could apply across different companies and contexts.";
    }

    const analysisPrompt = `Analyze this research paper. Structure your response with clear markdown headers:

## Summary
Provide a concise summary of the paper's main contribution.

## Key Findings
List the most important technical findings.

## Product Implications
Identify 3 specific product implications.${contextSection}`;

    // Build message content based on input type
    type ContentBlock =
      | {
          type: "document";
          source: { type: "base64"; media_type: "application/pdf"; data: string };
        }
      | { type: "text"; text: string };

    const messageContent: ContentBlock[] = [];

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
        text: analysisPrompt,
      });
    } else {
      // Text input
      messageContent.push({
        type: "text",
        text: `${analysisPrompt}\n\nResearch Paper:\n${paperText}`,
      });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const messageStream = anthropic.messages.stream({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            messages: [
              {
                role: "user",
                content: messageContent,
              },
            ],
          });

          let fullText = "";
          const sentSections = new Set<string>();

          const sectionMap: Record<string, string> = {
            "## summary": "Generating summary...",
            "## key": "Analyzing key findings...",
            "## product": "Identifying product implications...",
          };

          for await (const event of messageStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              fullText += text;

              // Detect section transitions based on actual content
              const lowerText = fullText.toLowerCase();
              for (const [marker, status] of Object.entries(sectionMap)) {
                if (lowerText.includes(marker) && !sentSections.has(marker)) {
                  sentSections.add(marker);
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "section", section: status })}\n\n`
                    )
                  );
                }
              }

              // Send text chunk
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", text })}\n\n`
                )
              );
            }
          }

          // Send completion
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", fullText })}\n\n`
            )
          );
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Failed to analyze paper";
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
    console.error("Error analyzing paper:", error);
    return new Response(JSON.stringify({ error: "Failed to analyze paper" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
