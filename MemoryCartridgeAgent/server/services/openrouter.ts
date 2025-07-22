import { ChatRequest, CartridgeSelectionResult, Cartridge } from "@shared/schema";

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OpenRouterService {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is required");
    }
  }

  async selectCartridge(
    query: string, 
    cartridges: Cartridge[]
  ): Promise<CartridgeSelectionResult> {
    const prompt = this.buildCartridgeSelectionPrompt(query, cartridges);
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.REPLIT_DOMAINS || "http://localhost:5000",
        },
        body: JSON.stringify({
          model: "openai/gpt-4.1-nano",
          messages: [
            {
              role: "system",
              content: "You are a cartridge selection agent. Analyze the user query and select the most relevant memory cartridge. Respond with valid JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data: OpenRouterResponse = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error("No content in OpenRouter response");
      }

      const result = JSON.parse(content);
      
      // Validate the result
      if (!result.selectedCartridgeId || !result.matchScore || !result.reasoning) {
        throw new Error("Invalid cartridge selection result format");
      }

      return {
        selectedCartridgeId: result.selectedCartridgeId,
        matchScore: Math.min(100, Math.max(0, result.matchScore)),
        reasoning: result.reasoning,
      };
    } catch (error) {
      console.error("OpenRouter API error:", error);
      
      // Fallback to first cartridge if API fails
      const fallbackCartridge = cartridges.find(c => c.isActive) || cartridges[0];
      return {
        selectedCartridgeId: fallbackCartridge.id,
        matchScore: 50,
        reasoning: "Fallback selection due to API error",
      };
    }
  }

  private buildCartridgeSelectionPrompt(query: string, cartridges: Cartridge[]): string {
    const cartridgeDescriptions = cartridges.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      tags: c.metadata.tags || [],
      nodeCount: c.metadata.nodeCount,
      lastUpdated: c.updatedAt,
    }));

    return `
Analyze this user query and select the most relevant memory cartridge:

User Query: "${query}"

Available Cartridges:
${JSON.stringify(cartridgeDescriptions, null, 2)}

Consider:
1. Semantic similarity between query and cartridge descriptions
2. Relevance of tags to the query topic
3. Cartridge size and content depth (node count)
4. Recent activity (last updated)

Respond with JSON in this exact format:
{
  "selectedCartridgeId": <number>,
  "matchScore": <number between 0-100>,
  "reasoning": "<brief explanation of why this cartridge was selected>"
}
    `.trim();
  }
}
