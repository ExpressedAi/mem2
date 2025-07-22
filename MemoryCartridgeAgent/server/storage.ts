import { 
  cartridges, 
  messages, 
  users, 
  type User, 
  type InsertUser, 
  type Cartridge, 
  type InsertCartridge,
  type UpdateCartridge,
  type Message,
  type InsertMessage 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Cartridge operations
  getCartridges(): Promise<Cartridge[]>;
  getCartridge(id: number): Promise<Cartridge | undefined>;
  createCartridge(cartridge: InsertCartridge): Promise<Cartridge>;
  updateCartridge(id: number, updates: UpdateCartridge): Promise<Cartridge | undefined>;
  deleteCartridge(id: number): Promise<boolean>;
  setActiveCartridge(id: number): Promise<void>;
  
  // Message operations
  getMessages(limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByCartridge(cartridgeId: number): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private cartridges: Map<number, Cartridge>;
  private messages: Map<number, Message>;
  private currentUserId: number;
  private currentCartridgeId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.cartridges = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentCartridgeId = 1;
    this.currentMessageId = 1;
    
    // Initialize with some default cartridges
    this.initializeDefaultCartridges();
  }

  private initializeDefaultCartridges() {
    const defaultCartridges: InsertCartridge[] = [
      {
        name: "Web Development",
        description: "React, Next.js, TypeScript patterns and best practices",
        episodicMemory: { conversations: [] },
        semanticMemory: { concepts: {} },
        proceduralMemory: { workflows: [] },
        metadata: {
          version: "1.0.0",
          sizeMb: 2.4,
          nodeCount: 1247,
          tags: ["react", "typescript", "web"]
        },
        isActive: true
      },
      {
        name: "AI/ML Research",
        description: "Machine learning papers, model architectures, training techniques",
        episodicMemory: { conversations: [] },
        semanticMemory: { concepts: {} },
        proceduralMemory: { workflows: [] },
        metadata: {
          version: "1.0.0",
          sizeMb: 4.1,
          nodeCount: 2891,
          tags: ["ai", "ml", "research"]
        },
        isActive: false
      },
      {
        name: "System Design",
        description: "Scalable architecture patterns, distributed systems",
        episodicMemory: { conversations: [] },
        semanticMemory: { concepts: {} },
        proceduralMemory: { workflows: [] },
        metadata: {
          version: "1.0.0",
          sizeMb: 1.8,
          nodeCount: 892,
          tags: ["system-design", "architecture"]
        },
        isActive: false
      }
    ];

    defaultCartridges.forEach(cartridge => {
      this.createCartridge(cartridge);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Cartridge operations
  async getCartridges(): Promise<Cartridge[]> {
    return Array.from(this.cartridges.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getCartridge(id: number): Promise<Cartridge | undefined> {
    return this.cartridges.get(id);
  }

  async createCartridge(insertCartridge: InsertCartridge): Promise<Cartridge> {
    const id = this.currentCartridgeId++;
    const now = new Date();
    const cartridge: Cartridge = {
      ...insertCartridge,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.cartridges.set(id, cartridge);
    return cartridge;
  }

  async updateCartridge(id: number, updates: UpdateCartridge): Promise<Cartridge | undefined> {
    const cartridge = this.cartridges.get(id);
    if (!cartridge) return undefined;

    const updatedCartridge: Cartridge = {
      ...cartridge,
      ...updates,
      updatedAt: new Date(),
    };
    this.cartridges.set(id, updatedCartridge);
    return updatedCartridge;
  }

  async deleteCartridge(id: number): Promise<boolean> {
    return this.cartridges.delete(id);
  }

  async setActiveCartridge(id: number): Promise<void> {
    // Set all cartridges to inactive
    for (const [cartridgeId, cartridge] of this.cartridges) {
      if (cartridge.isActive) {
        this.cartridges.set(cartridgeId, { ...cartridge, isActive: false });
      }
    }
    
    // Set the specified cartridge as active
    const cartridge = this.cartridges.get(id);
    if (cartridge) {
      this.cartridges.set(id, { ...cartridge, isActive: true });
    }
  }

  // Message operations
  async getMessages(limit: number = 100): Promise<Message[]> {
    const messages = Array.from(this.messages.values())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    return limit ? messages.slice(-limit) : messages;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesByCartridge(cartridgeId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.cartridgeId === cartridgeId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getCartridges(): Promise<Cartridge[]> {
    const result = await db.select().from(cartridges).orderBy(cartridges.updatedAt);
    return result.reverse(); // Most recent first
  }

  async getCartridge(id: number): Promise<Cartridge | undefined> {
    const [cartridge] = await db.select().from(cartridges).where(eq(cartridges.id, id));
    return cartridge || undefined;
  }

  async createCartridge(insertCartridge: InsertCartridge): Promise<Cartridge> {
    const [cartridge] = await db
      .insert(cartridges)
      .values(insertCartridge)
      .returning();
    return cartridge;
  }

  async updateCartridge(id: number, updates: UpdateCartridge): Promise<Cartridge | undefined> {
    const [cartridge] = await db
      .update(cartridges)
      .set(updates)
      .where(eq(cartridges.id, id))
      .returning();
    return cartridge || undefined;
  }

  async deleteCartridge(id: number): Promise<boolean> {
    const result = await db.delete(cartridges).where(eq(cartridges.id, id));
    return result.rowCount > 0;
  }

  async setActiveCartridge(id: number): Promise<void> {
    // First set all cartridges to inactive
    await db.update(cartridges).set({ isActive: false });
    
    // Then set the specified cartridge as active
    await db.update(cartridges).set({ isActive: true }).where(eq(cartridges.id, id));
  }

  async getMessages(limit: number = 100): Promise<Message[]> {
    const result = await db.select().from(messages).orderBy(messages.createdAt).limit(limit);
    return result;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getMessagesByCartridge(cartridgeId: number): Promise<Message[]> {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.cartridgeId, cartridgeId))
      .orderBy(messages.createdAt);
    return result;
  }
}

export const storage = new DatabaseStorage();
