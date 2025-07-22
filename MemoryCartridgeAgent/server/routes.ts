import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { CartridgeSelectorService } from "./services/cartridge-selector";
import { 
  chatRequestSchema, 
  insertCartridgeSchema, 
  updateCartridgeSchema 
} from "@shared/schema";
import { z } from "zod";

const cartridgeSelector = new CartridgeSelectorService();

export async function registerRoutes(app: Express): Promise<Server> {
  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, forceCartridgeId } = chatRequestSchema.parse(req.body);
      
      // Process the query through the cartridge selector
      const result = await cartridgeSelector.processQuery(message, forceCartridgeId);
      
      // Save user message
      const userMessage = await storage.createMessage({
        content: message,
        role: "user",
        cartridgeId: result.selection.selectedCartridgeId,
        selectedCartridgeId: result.selection.selectedCartridgeId,
        matchScore: result.selection.matchScore,
        tokenCount: 0,
        cost: "0",
        metadata: {},
      });

      // Save AI response
      const aiMessage = await storage.createMessage({
        content: result.response,
        role: "assistant",
        cartridgeId: result.selection.selectedCartridgeId,
        selectedCartridgeId: result.selection.selectedCartridgeId,
        matchScore: result.selection.matchScore,
        tokenCount: result.tokenCount,
        cost: result.cost,
        metadata: {
          model: "gpt-4o-mini",
          processingTime: Date.now(),
        },
      });

      res.json({
        userMessage,
        aiMessage,
        selection: result.selection,
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Internal server error" 
      });
    }
  });

  // Get all cartridges
  app.get("/api/cartridges", async (req, res) => {
    try {
      const cartridges = await storage.getCartridges();
      res.json(cartridges);
    } catch (error) {
      console.error("Error fetching cartridges:", error);
      res.status(500).json({ message: "Failed to fetch cartridges" });
    }
  });

  // Get specific cartridge
  app.get("/api/cartridges/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cartridge = await storage.getCartridge(id);
      
      if (!cartridge) {
        return res.status(404).json({ message: "Cartridge not found" });
      }
      
      res.json(cartridge);
    } catch (error) {
      console.error("Error fetching cartridge:", error);
      res.status(500).json({ message: "Failed to fetch cartridge" });
    }
  });

  // Create new cartridge
  app.post("/api/cartridges", async (req, res) => {
    try {
      const cartridgeData = insertCartridgeSchema.parse(req.body);
      const cartridge = await storage.createCartridge(cartridgeData);
      res.status(201).json(cartridge);
    } catch (error) {
      console.error("Error creating cartridge:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid cartridge data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create cartridge" });
      }
    }
  });

  // Update cartridge
  app.patch("/api/cartridges/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = updateCartridgeSchema.parse(req.body);
      const cartridge = await storage.updateCartridge(id, updates);
      
      if (!cartridge) {
        return res.status(404).json({ message: "Cartridge not found" });
      }
      
      res.json(cartridge);
    } catch (error) {
      console.error("Error updating cartridge:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid update data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update cartridge" });
      }
    }
  });

  // Delete cartridge
  app.delete("/api/cartridges/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCartridge(id);
      
      if (!success) {
        return res.status(404).json({ message: "Cartridge not found" });
      }
      
      res.json({ message: "Cartridge deleted successfully" });
    } catch (error) {
      console.error("Error deleting cartridge:", error);
      res.status(500).json({ message: "Failed to delete cartridge" });
    }
  });

  // Set active cartridge
  app.post("/api/cartridges/:id/activate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.setActiveCartridge(id);
      res.json({ message: "Cartridge activated successfully" });
    } catch (error) {
      console.error("Error activating cartridge:", error);
      res.status(500).json({ message: "Failed to activate cartridge" });
    }
  });

  // Get messages
  app.get("/api/messages", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const messages = await storage.getMessages(limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get messages by cartridge
  app.get("/api/cartridges/:id/messages", async (req, res) => {
    try {
      const cartridgeId = parseInt(req.params.id);
      const messages = await storage.getMessagesByCartridge(cartridgeId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching cartridge messages:", error);
      res.status(500).json({ message: "Failed to fetch cartridge messages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
