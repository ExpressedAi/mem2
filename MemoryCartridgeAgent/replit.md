# Infinite Context Chat - Memory Cartridge System

## Overview

This is a full-stack TypeScript application that implements an AI chat system with "memory cartridges" - specialized AI memory units that can be dynamically selected based on user queries. The system uses a multi-agent architecture where a cartridge selector agent chooses the most appropriate memory cartridge for each query, and then a response generation agent creates contextually relevant responses.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with custom configuration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **API Style**: REST endpoints

### Key Components

1. **Memory Cartridge System**
   - Cartridges contain episodic, semantic, and procedural memory
   - Each cartridge has metadata including size, node count, and tags
   - Active cartridge selection based on query relevance

2. **Multi-Agent AI System**
   - Cartridge Selector Agent: Uses OpenRouter GPT-4.1-nano for cartridge selection
   - Response Generator: Uses OpenRouter GPT-4o-mini for generating responses
   - Selection scoring system with match confidence

3. **Chat Interface**
   - Real-time chat with message history
   - System monitor showing agent activity
   - Cartridge management sidebar
   - Visual feedback for cartridge selection

## Data Flow

1. User submits a message through the chat interface
2. CartridgeSelectorService analyzes the query using OpenRouter GPT-4.1-nano
3. System selects the most appropriate cartridge based on similarity
4. Response generator creates a response using OpenRouter GPT-4o-mini with selected cartridge's context
5. Both user message and AI response are stored persistently in PostgreSQL database
6. Cartridge episodic memory is updated with new conversation data
7. UI updates with new messages and system activity

## External Dependencies

### AI Services
- **OpenRouter**: GPT-4.1-nano for cartridge selection and GPT-4o-mini for response generation

### Database
- **Neon**: Serverless PostgreSQL database
- **Drizzle**: Type-safe ORM with PostgreSQL dialect

### UI Components
- **shadcn/ui**: Comprehensive component library built on Radix UI
- **Radix UI**: Headless UI primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework

## Deployment Strategy

The application is configured for Replit deployment with:
- Development server using tsx for TypeScript execution
- Production build with Vite for frontend and esbuild for backend
- Database migrations through Drizzle Kit
- Environment variables for API keys and database connection

### Build Process
1. Frontend builds to `dist/public` using Vite
2. Backend bundles to `dist/index.js` using esbuild
3. Static assets served through Express in production
4. Development uses Vite middleware for hot reloading

### Environment Requirements
- `DATABASE_URL`: PostgreSQL connection string
- `OPENROUTER_API_KEY`: OpenRouter API access for both cartridge selection and response generation

The system implements a sophisticated memory management approach where different AI personalities or knowledge domains can be encapsulated in cartridges, allowing for specialized responses based on context and user intent.