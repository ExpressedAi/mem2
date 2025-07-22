import { Message, Cartridge } from "@shared/schema";

interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekService {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is required");
    }
  }

  async generateResponse(
    userMessage: string,
    selectedCartridge: Cartridge,
    recentMessages: Message[] = []
  ): Promise<{ content: string; tokenCount: number; cost: string }> {
    const messages = this.buildMessageHistory(userMessage, selectedCartridge, recentMessages);
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.REPLIT_DOMAINS || "http://localhost:5000",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages,
          temperature: 0.7,
          max_tokens: 2000,
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

      const tokenCount = data.usage?.total_tokens || 0;
      const cost = this.calculateCost(tokenCount);

      return {
        content,
        tokenCount,
        cost,
      };
    } catch (error) {
      console.error("OpenRouter API error:", error);
      throw error;
    }
  }

  private buildMessageHistory(
    userMessage: string,
    selectedCartridge: Cartridge,
    recentMessages: Message[]
  ): OpenRouterMessage[] {
    const messages: OpenRouterMessage[] = [
      {
        role: "system",
        content: this.buildSystemPrompt(selectedCartridge),
      },
    ];

    // Add recent conversation history (last 10 messages)
    const relevantMessages = recentMessages.slice(-10);
    for (const msg of relevantMessages) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Add current user message
    messages.push({
      role: "user",
      content: userMessage,
    });

    return messages;
  }

  private buildSystemPrompt(cartridge: Cartridge): string {
    return `
You are an AI assistant with access to episodic memory from the "${cartridge.name}" cartridge.

Cartridge Description: ${cartridge.description}

Available Memory Context:
- Episodic Memory: ${JSON.stringify(cartridge.episodicMemory, null, 2)}
- Semantic Memory: ${JSON.stringify(cartridge.semanticMemory, null, 2)}
- Procedural Memory: ${JSON.stringify(cartridge.proceduralMemory, null, 2)}

Instructions:
1. Use the memory context to provide informed, relevant responses
2. Reference specific concepts, procedures, or past conversations when applicable
3. If the memory is empty or insufficient, acknowledge this and provide general assistance
4. Always be helpful, accurate, and conversational
5. When providing code examples or technical explanations, be precise and practical

Remember: You have access to the accumulated knowledge and patterns stored in this cartridge's memory graph.
    `.trim();
  }

  private calculateCost(tokenCount: number): string {
    // OpenRouter pricing for GPT-4o-mini is much lower than full GPT-4
    // Using approximate pricing: $0.15 per million tokens for input, $0.60 per million tokens for output
    // Simplified calculation assuming 50/50 split
    const costPerToken = 0.000000375; // Average cost per token for gpt-4o-mini
    const totalCost = tokenCount * costPerToken;
    return totalCost.toFixed(6);
  }
}
