# 📁 LeadConnect Project Structure

This document outlines the organized structure of the LeadConnect application, which follows a monorepo pattern with clear separation between client and server components.

## 🏗️ Overall Architecture

```
LeadConnect/
├── 📁 client/           # Frontend React application (Self-contained)
│   ├── 📁 src/          # React source code
│   ├── 📁 public/       # Static assets
│   ├── 📁 shared/       # Client-specific shared types
│   ├── 📁 terraform/    # Client infrastructure (S3/CloudFront)
│   ├── package.json     # Client dependencies
│   ├── Dockerfile       # Client Docker build
│   ├── nginx.conf       # Nginx configuration
│   └── aws-deploy-separate.sh # Client deployment script
├── 📁 server/           # Backend Node.js/Express API (Self-contained)
│   ├── 📁 migrations/   # Database migrations
│   ├── 📁 shared/       # Server-specific shared types
│   ├── 📁 terraform/    # Server infrastructure (ECS/ALB)
│   ├── package.json     # Server dependencies
│   ├── Dockerfile       # Server Docker build
│   ├── drizzle.config.ts # Database configuration
│   ├── serverless.yml   # Serverless configuration
│   └── aws-deploy-separate.sh # Server deployment script
├── 📁 attached_assets/  # Static assets (images, etc.)
├── 📁 .github/          # GitHub Actions workflows
└── 📄 Root config files # Monorepo configuration
```

## 📱 Client Directory (`/client`)

**Purpose**: React frontend application with TypeScript, Vite, and Tailwind CSS

### Structure:
```
client/
├── 📁 src/
│   ├── 📁 components/     # React components
│   │   ├── 📁 ui/        # Reusable UI components (shadcn/ui)
│   │   └── *.tsx         # Feature-specific components
│   ├── 📁 pages/         # Page components
│   ├── 📁 hooks/         # Custom React hooks
│   ├── 📁 lib/           # Utility functions and services
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # App entry point
│   └── index.css         # Global styles
├── 📁 public/            # Static assets
├── 📁 shared/            # Client-specific shared types
├── 📁 terraform/         # Client infrastructure (S3/CloudFront)
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
└── components.json       # shadcn/ui configuration
```

### Key Features:
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Query** for data fetching
- **Wouter** for routing
- **React Hook Form** for form handling

## 🖥️ Server Directory (`/server`)

**Purpose**: Node.js/Express backend API with TypeScript

### Structure:
```
server/
├── index.ts              # Server entry point
├── routes.ts             # API route definitions
├── storage.ts            # Database operations
├── auth-middleware.ts    # Authentication middleware
├── two-factor-auth.ts    # 2FA implementation
├── notifications.ts      # Notification system
├── migration-utility.ts  # Database migration utilities
├── vite.ts              # Vite integration for development
├── init-database.js     # Database initialization script
├── tsconfig.json        # TypeScript configuration
├── 📁 migrations/       # Database migrations
├── 📁 shared/           # Server-specific shared types
└── 📁 terraform/        # Server infrastructure (ECS/ALB)
```

### Key Features:
- **Express.js** with TypeScript
- **Drizzle ORM** for database operations
- **Passport.js** for authentication
- **Express Session** for session management
- **WebSocket** support for real-time features
- **Email integration** with SendGrid/Nodemailer
- **Two-Factor Authentication** support

## 🔄 Shared Directories

**Purpose**: Duplicated shared types, schemas, and utilities for self-contained deployments

### Client Shared Structure:
```
client/shared/
└── schema.ts            # Database schema definitions (Drizzle)
```

### Server Shared Structure:
```
server/shared/
└── schema.ts            # Database schema definitions (Drizzle)
```

## 🗄️ Database & Migrations

### Structure:
```
server/migrations/
├── 📁 meta/             # Migration metadata
├── 0000_*.sql          # Migration files
└── ...
```

### Key Features:
- **PostgreSQL** database
- **Drizzle ORM** for type-safe database operations
- **Migration system** for schema versioning
- **Connection pooling** for performance

## 🚀 Deployment & Infrastructure

### Root Configuration Files:
- `package.json` - Monorepo package management
- `drizzle.config.ts` - Database configuration
- `docker-compose.yml` - Local development setup
- `Dockerfile` - Monolithic deployment
- `Dockerfile.client` - Client-only deployment
- `Dockerfile.server` - Server-only deployment

### AWS Deployment:
- `aws-deploy.sh` - Monolithic deployment script
- `aws-deploy-separate.sh` - Separate client/server deployment
- `serverless.yml` - Serverless Framework configuration
- `terraform/` - Infrastructure as Code

### CI/CD:
- `.github/workflows/` - GitHub Actions workflows

## 📦 Package Management

### Root `package.json` Scripts:
```json
{
  "dev": "NODE_ENV=development tsx server/index.ts",
  "build": "npm run build:client && npm run build:server",
  "build:client": "cd client && vite build",
  "build:server": "esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  "start": "NODE_ENV=production node dist/index.js",
  "db:push": "drizzle-kit push",
  "db:generate": "drizzle-kit generate",
  "db:init": "tsx server/init-database.js"
}
```

## 🔧 Development Workflow

### Local Development:
1. **Install dependencies**: `npm install`
2. **Setup database**: `npm run setup`
3. **Start development server**: `npm run dev`
4. **Build for production**: `npm run build`

### Docker Development:
```bash
# Start with Docker Compose
docker-compose up

# Build and run monolithic
docker build -t leadconnect .
docker run -p 3000:3000 leadconnect
```

## 🎯 Key Benefits of This Structure

1. **Clear Separation**: Client and server code are clearly separated
2. **Shared Resources**: Common types and schemas are shared
3. **Flexible Deployment**: Support for both monolithic and separate deployments
4. **Type Safety**: Full TypeScript support across the stack
5. **Scalability**: Easy to scale individual components
6. **Maintainability**: Well-organized code structure
7. **Development Experience**: Fast hot reloading and efficient builds

## 🔄 Import Paths

### Client Imports:
```typescript
import { Component } from '@/components/Component'
import { schema } from '@shared/schema'
import { asset } from '@assets/image.png'
```

### Server Imports:
```typescript
import { schema } from '@shared/schema'
import { storage } from './storage'
```

**Note**: Both client and server now have their own copy of shared files for self-contained deployments.

## 📋 Next Steps

1. **Environment Setup**: Configure environment variables
2. **Database Setup**: Run migrations and initialize data
3. **Authentication**: Configure authentication providers
4. **Email Setup**: Configure email service
5. **Deployment**: Choose deployment strategy and deploy

For detailed deployment instructions, see [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md). 