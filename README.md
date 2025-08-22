# 🚀 LeadConnect - Monorepo Structure

This repository contains a monorepo with separate client and server applications, each self-contained for independent deployment.

## 📁 Repository Structure

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
├── .dockerignore        # Docker ignore rules
├── .gitignore          # Git ignore rules
├── tsconfig.json       # Root TypeScript configuration
├── docker-compose.yml  # Local development setup
└── README.md           # This file
```

## 🎯 Deployment Strategy

### **Separate Deployments**
Each directory (`client/` and `server/`) is completely self-contained and can be deployed independently:

- **Client**: Deployed to AWS S3 + CloudFront
- **Server**: Deployed to AWS ECS Fargate or Lambda

### **Local Development**
For local development, use Docker Compose:

```bash
# Start both client and server locally
docker-compose up
```

## 🚀 Quick Start

### **Client Development**
```bash
cd client/
npm install
npm run dev
```

### **Server Development**
```bash
cd server/
npm install
npm run dev
```

### **Client Deployment**
```bash
cd client/
npm install
npm run build
npm run deploy
```

### **Server Deployment**
```bash
cd server/
npm install
npm run build
npm run deploy
```

## 📋 Documentation

- **Client Documentation**: See `client/README.md`
- **Server Documentation**: See `server/README.md`
- **Deployment Guide**: See `client/AWS_DEPLOYMENT_GUIDE.md` and `server/AWS_DEPLOYMENT_GUIDE.md`
- **Project Structure**: See `PROJECT_STRUCTURE.md`
- **Two-Factor Auth**: See `TWO_FACTOR_AUTH.md`
- **Notification System**: See `NOTIFICATION_SYSTEM.md`
- **Email Setup**: See `EMAIL_SETUP.md`

## 🔧 Technology Stack

### **Client**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui for components
- React Query for data fetching
- Wouter for routing

### **Server**
- Node.js with TypeScript
- Express.js framework
- Drizzle ORM for database
- PostgreSQL database
- Passport.js for authentication
- WebSocket support
- Email integration

## 🏗️ Infrastructure

### **Client Infrastructure** (`client/terraform/`)
- S3 Bucket for static files
- CloudFront distribution for CDN
- IAM roles for deployment

### **Server Infrastructure** (`server/terraform/`)
- ECS Fargate cluster
- Application Load Balancer
- ECR repository for Docker images
- CloudWatch for logging
- IAM roles for execution

## 📦 Package Management

Each directory has its own `package.json` with specific dependencies and scripts:

- **Client**: Frontend dependencies and build scripts
- **Server**: Backend dependencies and database scripts

## 🔄 Development Workflow

1. **Local Development**: Use Docker Compose for full-stack development
2. **Testing**: Each directory has its own test setup
3. **Building**: Each directory has its own build process
4. **Deployment**: Each directory can be deployed independently

## 🎯 Benefits

- **Independent Scaling**: Client and server can scale separately
- **Technology Isolation**: Each can use different technologies
- **Team Separation**: Different teams can work independently
- **Deployment Flexibility**: Deploy client and server separately
- **Cost Optimization**: Pay only for what each deployment needs

## 📞 Support

For detailed information about each component, see the respective README files in the `client/` and `server/` directories. 