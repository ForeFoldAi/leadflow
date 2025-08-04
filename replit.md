# Overview

LeadFlow is a comprehensive lead management application built as a full-stack web application. It provides a centralized platform for tracking, managing, and analyzing sales leads with features including lead creation, filtering, search functionality, and analytics dashboard. The application is designed to help sales teams efficiently manage their pipeline and improve conversion rates.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent, accessible design
- **Styling**: Tailwind CSS with CSS custom properties for theming and responsive design
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **API Design**: RESTful endpoints with structured error handling and request logging
- **Development**: Vite for hot module replacement and fast development builds

## Data Storage Solutions
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Database**: PostgreSQL configured through Neon Database serverless connection
- **Schema**: Centralized schema definition in shared directory for type consistency
- **Migrations**: Drizzle Kit for database schema migrations and management

## Lead Management Features
- **CRUD Operations**: Full create, read, update, delete functionality for leads
- **Search & Filtering**: Real-time search with multi-criteria filtering (status, category, city)
- **Data Validation**: Comprehensive validation using Zod schemas for data integrity
- **Status Tracking**: Lead lifecycle management with predefined status categories
- **Contact Management**: Support for multiple communication channels and follow-up scheduling

## Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store
- **User System**: Basic user management structure prepared for authentication implementation

## Development and Build System
- **Build Tool**: Vite for frontend bundling with esbuild for backend compilation
- **Type Checking**: Strict TypeScript configuration across client, server, and shared modules
- **Path Aliases**: Configured import aliases for cleaner code organization
- **Development Experience**: Hot reload, error overlays, and development-specific tooling

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## UI and Styling
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for creating component variants

## Development Tools
- **Drizzle Kit**: Database migration and introspection toolkit
- **TanStack Query**: Powerful data synchronization for React applications
- **React Hook Form**: Performant forms with easy validation
- **Zod**: TypeScript-first schema validation library
- **date-fns**: Modern JavaScript date utility library

## Build and Development
- **Vite**: Next generation frontend tooling with plugin ecosystem
- **esbuild**: Extremely fast JavaScript bundler for production builds
- **tsx**: TypeScript execution environment for development
- **PostCSS**: CSS transformation with Tailwind and Autoprefixer plugins