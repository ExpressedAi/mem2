import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Memory Cartridge Schema
export const cartridges = pgTable("cartridges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  episodicMemory: jsonb("episodic_memory").$type<EpisodicMemory>().notNull().default({}),
  semanticMemory: jsonb("semantic_memory").$type<SemanticMemory>().notNull().default({}),
  proceduralMemory: jsonb("procedural_memory").$type<ProceduralMemory>().notNull().default({}),
  metadata: jsonb("metadata").$type<CartridgeMetadata>().notNull(),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Chat Messages Schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  role: text("role").$type<"user" | "assistant" | "system">().notNull(),
  cartridgeId: integer("cartridge_id").references(() => cartridges.id),
  selectedCartridgeId: integer("selected_cartridge_id").references(() => cartridges.id),
  matchScore: integer("match_score"), // 0-100 percentage
  tokenCount: integer("token_count"),
  cost: text("cost"), // string representation of cost
  metadata: jsonb("metadata").$type<MessageMetadata>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Type definitions for JSON fields
export interface EpisodicMemory {
  conversations: Array<{
    id: string;
    timestamp: string;
    topic: string;
    contextEmbedding?: number[];
    keyConcepts: string[];
    outcomes: string[];
  }>;
}

export interface SemanticMemory {
  concepts: Record<string, {
    definition: string;
    relationships: string[];
    confidence: number;
    sources: string[];
  }>;
}

export interface ProceduralMemory {
  workflows: Array<{
    name: string;
    steps: string[];
    successRate: number;
  }>;
}

export interface CartridgeMetadata {
  version: string;
  sizeMb: number;
  nodeCount: number;
  createdBy?: string;
  tags?: string[];
}

export interface MessageMetadata {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  processingTime?: number;
}

// Zod schemas for validation
export const insertCartridgeSchema = createInsertSchema(cartridges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const updateCartridgeSchema = insertCartridgeSchema.partial();

// API request/response types
export const chatRequestSchema = z.object({
  message: z.string().min(1),
  forceCartridgeId: z.number().optional(),
});

export const cartridgeSelectionResultSchema = z.object({
  selectedCartridgeId: z.number(),
  matchScore: z.number().min(0).max(100),
  reasoning: z.string(),
});

// Type exports
export type Cartridge = typeof cartridges.$inferSelect;
export type InsertCartridge = z.infer<typeof insertCartridgeSchema>;
export type UpdateCartridge = z.infer<typeof updateCartridgeSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type CartridgeSelectionResult = z.infer<typeof cartridgeSelectionResultSchema>;

// Users table (keeping existing structure)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
