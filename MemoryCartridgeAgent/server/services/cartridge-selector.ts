import { storage } from "../storage";
import { OpenRouterService } from "./openrouter";
import { DeepSeekService } from "./deepseek";
import { CartridgeSelectionResult } from "@shared/schema";

export class CartridgeSelectorService {
  private openRouterService: OpenRouterService;
  private deepSeekService: DeepSeekService;

  constructor() {
    this.openRouterService = new OpenRouterService();
    this.deepSeekService = new DeepSeekService();
  }

  async processQuery(message: string, forceCartridgeId?: number): Promise<{
    selection: CartridgeSelectionResult;
    response: string;
    tokenCount: number;
    cost: string;
  }> {
    try {
      // Get all available cartridges
      const cartridges = await storage.getCartridges();
      
      if (cartridges.length === 0) {
        throw new Error("No cartridges available");
      }

      let selection: CartridgeSelectionResult;
      
      if (forceCartridgeId) {
        // Use forced cartridge
        const forcedCartridge = cartridges.find(c => c.id === forceCartridgeId);
        if (!forcedCartridge) {
          throw new Error(`Forced cartridge with ID ${forceCartridgeId} not found`);
        }
        selection = {
          selectedCartridgeId: forceCartridgeId,
          matchScore: 100, // Perfect match since it's forced
          reasoning: "Cartridge was manually selected by user"
        };
        console.log("Using forced cartridge:", forcedCartridge.name);
      } else {
        // Use OpenRouter GPT-4.1-nano to select the best cartridge
        console.log("Selecting cartridge for query:", message.substring(0, 100) + "...");
        selection = await this.openRouterService.selectCartridge(message, cartridges);
      }
      
      // Get the selected cartridge
      const selectedCartridge = await storage.getCartridge(selection.selectedCartridgeId);
      if (!selectedCartridge) {
        throw new Error("Selected cartridge not found");
      }

      // Set as active cartridge
      await storage.setActiveCartridge(selection.selectedCartridgeId);

      // Get recent messages for context
      const recentMessages = await storage.getMessages(20);

      // Generate response using DeepSeek
      console.log("Generating response with DeepSeek for cartridge:", selectedCartridge.name);
      const aiResponse = await this.deepSeekService.generateResponse(
        message,
        selectedCartridge,
        recentMessages
      );

      // Update cartridge with new interaction
      await this.updateCartridgeMemory(selectedCartridge, message, aiResponse.content);

      return {
        selection,
        response: aiResponse.content,
        tokenCount: aiResponse.tokenCount,
        cost: aiResponse.cost,
      };
    } catch (error) {
      console.error("Error in CartridgeSelectorService:", error);
      throw error;
    }
  }

  private async updateCartridgeMemory(
    cartridge: any,
    userMessage: string,
    aiResponse: string
  ): Promise<void> {
    try {
      // Extract key concepts from the conversation
      const keyConcepts = this.extractKeyConcepts(userMessage + " " + aiResponse);
      
      // Create new episodic memory entry
      const newConversation = {
        id: `conv_${Date.now()}`,
        timestamp: new Date().toISOString(),
        topic: this.extractTopic(userMessage),
        keyConcepts,
        outcomes: [aiResponse.substring(0, 200) + "..."],
      };

      // Update episodic memory
      const updatedEpisodicMemory = {
        ...cartridge.episodicMemory,
        conversations: [
          ...cartridge.episodicMemory.conversations,
          newConversation,
        ].slice(-50), // Keep last 50 conversations
      };

      // Update metadata
      const updatedMetadata = {
        ...cartridge.metadata,
        nodeCount: cartridge.metadata.nodeCount + 1,
        sizeMb: cartridge.metadata.sizeMb + 0.001, // Small increment
      };

      // Save updated cartridge
      await storage.updateCartridge(cartridge.id, {
        episodicMemory: updatedEpisodicMemory,
        metadata: updatedMetadata,
      });
    } catch (error) {
      console.error("Error updating cartridge memory:", error);
      // Don't throw - memory update failure shouldn't break the chat
    }
  }

  private extractKeyConcepts(text: string): string[] {
    // Simple keyword extraction - in production, use NLP library
    const words = text.toLowerCase().split(/\s+/);
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
    ]);
    
    return words
      .filter(word => word.length > 3 && !commonWords.has(word))
      .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
      .slice(0, 10); // Take top 10
  }

  private extractTopic(message: string): string {
    // Simple topic extraction - first few words
    return message.split(' ').slice(0, 5).join(' ');
  }
}
