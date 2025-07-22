import { db } from "./db";
import { cartridges } from "@shared/schema";

async function seedDatabase() {
  console.log("Seeding database with default cartridges...");
  
  const defaultCartridges = [
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

  try {
    // Check if cartridges already exist
    const existingCartridges = await db.select().from(cartridges);
    
    if (existingCartridges.length === 0) {
      await db.insert(cartridges).values(defaultCartridges);
      console.log("Default cartridges created successfully!");
    } else {
      console.log("Cartridges already exist, skipping seed.");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seedDatabase().catch(console.error);