# Einbürgerungstest Quiz App

## Overview

This is a German citizenship test (Einbürgerungstest) practice application built with React and Express. The app allows users to practice for the German naturalization test with official questions, track their progress, and customize their learning experience.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Storage**: DatabaseStorage implementation using PostgreSQL
- **API**: RESTful API endpoints
- **Static Assets**: Express static middleware for question images

### Key Components

#### Database Schema
- **Questions Table**: Stores quiz questions with multiple choice answers, correct answers, explanations, and categories
- **Quiz Sessions Table**: Tracks completed quiz attempts with results and performance metrics
- **User Settings Table**: Stores user preferences for quiz customization

#### Core Features
- **Quiz Modes**: Full test mode (33 questions) and practice mode
- **Question Management**: Random question selection with shuffling options
- **Progress Tracking**: Session history, statistics, and performance analytics
- **Customizable Settings**: Timer, immediate feedback, question shuffling
- **Responsive Design**: Mobile-first approach with adaptive UI

#### Storage System
- **IStorage Interface**: Abstraction layer for data persistence
- **DatabaseStorage Implementation**: PostgreSQL storage using Drizzle ORM
- **Real Question Data**: 376 official German citizenship test questions loaded from Excel
- **Image Support**: 7 questions with visual content (images) properly integrated

## Data Flow

1. **Quiz Initialization**: User selects quiz type → Frontend requests random questions → Backend retrieves questions from database
2. **Question Display**: Questions rendered with multiple choice options → User selections tracked in local state
3. **Answer Submission**: User answers stored locally → Progress calculated in real-time
4. **Quiz Completion**: Final results calculated → Session data sent to backend → Results stored in database
5. **Statistics**: Historical data retrieved for progress tracking and analytics

## External Dependencies

### Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe database ORM
- **@neondatabase/serverless**: PostgreSQL database connection
- **wouter**: Lightweight client-side routing

### UI and Styling Dependencies
- **@radix-ui/***: Headless UI components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx**: Conditional class name utility

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **@replit/vite-plugin-***: Replit-specific development tools

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Environment variable `DATABASE_URL` for connection
- **Build Process**: Vite builds frontend, esbuild bundles backend

### Production Build
- **Frontend**: Static assets built to `dist/public`
- **Backend**: Bundled Node.js application in `dist/index.js`
- **Database Migrations**: Drizzle Kit handles schema migrations
- **Environment**: Production mode with optimized builds

### Configuration
- **Environment Variables**: `DATABASE_URL`, `NODE_ENV`
- **TypeScript**: Strict mode enabled with path mapping
- **Module System**: ESM modules throughout the application

## Changelog

Changelog:
- June 28, 2025. Initial setup with complete quiz system
- June 28, 2025. Added PostgreSQL database integration with Drizzle ORM
- June 28, 2025. Integrated 376 real German citizenship test questions from Excel
- June 28, 2025. Added image support for 7 visual questions with static asset serving

## User Preferences

Preferred communication style: Simple, everyday language.