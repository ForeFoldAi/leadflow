# AWS Deployment Guide for LeadConnect

## 🏗️ **Deployment Architecture Options**

### **Option 1: Monolithic Deployment (Recommended) ✅**
- **Single container** with both client and server
- **Simpler** to manage and deploy
- **Cost-effective** for most use cases
- **Better for small to medium applications**

### **Option 2: Separate Deployments**
- **Client**: S3 + CloudFront (static hosting)
- **Server**: ECS Fargate (API backend)
- **More complex** but better for scaling
- **Better for high-traffic applications**

---

## 🚀 **Option 1: Monolithic Deployment**

### **Quick Start (Recommended)**

1. **Prerequisites:**
   ```bash
   # Install AWS CLI
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   
   # Install Docker
   # Follow Docker installation guide for your OS
   
   # Configure AWS credentials
   aws configure
   ```

2. **Set up database:**
   ```bash
   # Create RDS PostgreSQL instance or use existing database
   # Get your DATABASE_URL
   export DATABASE_URL="postgresql://username:password@host:port/database"
   ```

3. **Deploy:**
   ```bash
   # Run the monolithic deployment script
   ./aws-deploy.sh
   ```

### **What it creates:**
- ✅ ECR Repository for Docker images
- ✅ ECS Fargate Cluster
- ✅ Application Load Balancer
- ✅ CloudWatch Logs
- ✅ IAM Roles and Security Groups

---

## 🌐 **Option 2: Separate Deployments**

### **Client Deployment (S3 + CloudFront)**

1. **Build and deploy client:**
   ```bash
   # Build client
   npm run build:client
   
   # Deploy to S3
   aws s3 sync client/dist/ s3://leadconnect-client-bucket --delete
   
   # Create CloudFront distribution
   aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
   ```

### **Server Deployment (ECS Fargate)**

1. **Build and deploy server:**
   ```bash
   # Build server Docker image
   docker build -f Dockerfile.server -t leadconnect-server .
   
   # Push to ECR
   docker tag leadconnect-server:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/leadconnect-server-repo:latest
   docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/leadconnect-server-repo:latest
   
   # Deploy to ECS
   aws ecs update-service --cluster leadconnect-cluster --service leadconnect-server-service --force-new-deployment
   ```

### **Automated Separate Deployment:**
   ```bash
   # Run the separate deployment script
   ./aws-deploy-separate.sh
   ```

---

## 📊 **Comparison: Monolithic vs Separate**

| Aspect | Monolithic | Separate |
|--------|------------|----------|
| **Complexity** | Simple | Complex |
| **Cost** | Lower | Higher |
| **Scaling** | Limited | Better |
| **Performance** | Good | Excellent |
| **Maintenance** | Easy | Moderate |
| **Deployment Speed** | Fast | Slower |

### **Choose Monolithic if:**
- ✅ Small to medium application
- ✅ Limited budget
- ✅ Simple requirements
- ✅ Quick deployment needed

### **Choose Separate if:**
- ✅ High traffic expected
- ✅ Need global CDN
- ✅ Want to scale independently
- ✅ Have budget for optimization

---

## 🔧 **Configuration Files**

### **Monolithic Deployment:**
- `Dockerfile` - Single container with client + server
- `aws-deploy.sh` - Automated deployment script
- `docker-compose.yml` - Local development

### **Separate Deployment:**
- `Dockerfile.client` - Client-only container
- `Dockerfile.server` - Server-only container
- `aws-deploy-separate.sh` - Separate deployment script
- `nginx.conf` - Nginx configuration for client
- `cloudfront-config.json` - CloudFront configuration

---

## 💰 **Cost Estimation**

### **Monolithic Deployment:**
- **ECS Fargate**: ~$30-50/month (2 tasks, 512 CPU, 1GB RAM)
- **Application Load Balancer**: ~$20/month
- **CloudWatch Logs**: ~$5-10/month
- **ECR**: ~$1-5/month
- **Data Transfer**: ~$5-15/month
- **Total**: ~$60-100/month

### **Separate Deployment:**
- **S3**: ~$1-5/month
- **CloudFront**: ~$10-30/month
- **ECS Fargate**: ~$30-50/month
- **Application Load Balancer**: ~$20/month
- **CloudWatch Logs**: ~$5-10/month
- **ECR**: ~$1-5/month
- **Data Transfer**: ~$5-15/month
- **Total**: ~$70-130/month

---

## 🚀 **Deployment Steps**

### **Step 1: Choose Your Approach**
```bash
# For monolithic deployment
./aws-deploy.sh

# For separate deployment
./aws-deploy-separate.sh
```

### **Step 2: Set Environment Variables**
```bash
export DATABASE_URL="postgresql://username:password@host:port/database"
export AWS_REGION="us-east-1"
```

### **Step 3: Run Deployment**
```bash
# The script will:
# 1. Build Docker images
# 2. Push to ECR
# 3. Create ECS cluster and services
# 4. Set up load balancers
# 5. Configure security groups
```

### **Step 4: Verify Deployment**
```bash
# Get application URL
aws elbv2 describe-load-balancers --names leadconnect-lb --query 'LoadBalancers[0].DNSName'

# Check service status
aws ecs describe-services --cluster leadconnect-cluster --services leadconnect-service
```

---

## 🔐 **Security Considerations**

### **Database Security:**
- Use AWS Secrets Manager for database credentials
- Ensure database is in private subnet
- Enable SSL connections

### **Application Security:**
- HTTPS enabled (add SSL certificate)
- Security groups properly configured
- IAM roles with minimal required permissions

### **Environment Variables:**
- Never commit sensitive data to Git
- Use AWS Secrets Manager or Parameter Store

---

## 📊 **Monitoring & Logging**

### **CloudWatch Logs:**
```bash
# View application logs
aws logs tail /ecs/leadconnect --follow

# View service events
aws ecs describe-services --cluster leadconnect-cluster --services leadconnect-service
```

### **CloudWatch Metrics:**
- ECS service metrics
- Load balancer metrics
- Application performance

---

## 🔄 **CI/CD Integration**

### **GitHub Actions:**
```yaml
# .github/workflows/deploy.yml
# Automatically deploys on push to main branch
```

### **Manual Deployment:**
```bash
# Update service with new image
aws ecs update-service --cluster leadconnect-cluster --service leadconnect-service --force-new-deployment
```

---

## 🛠️ **Troubleshooting**

### **Common Issues:**

1. **Deployment fails:**
   ```bash
   # Check AWS credentials and permissions
   aws sts get-caller-identity
   
   # Verify database connectivity
   aws rds describe-db-instances
   ```

2. **Application not accessible:**
   ```bash
   # Check security group rules
   aws ec2 describe-security-groups --group-names leadconnect-sg
   
   # Verify load balancer health checks
   aws elbv2 describe-target-health --target-group-arn $TARGET_GROUP_ARN
   ```

3. **Database connection issues:**
   ```bash
   # Check Secrets Manager
   aws secretsmanager describe-secret --secret-id leadconnect/database-url
   
   # Verify network connectivity
   aws ec2 describe-vpcs
   ```

---

## 📝 **Next Steps**

1. **Choose your deployment approach** (monolithic recommended for most cases)
2. **Set up your database** (RDS PostgreSQL recommended)
3. **Configure environment variables**
4. **Run the deployment script**
5. **Verify the deployment**
6. **Set up monitoring and alerts**
7. **Configure custom domain (optional)**

---

## 🎯 **Recommendation**

**For LeadConnect, I recommend starting with the Monolithic Deployment** because:

✅ **Simpler to manage** - Single container, single deployment
✅ **Cost-effective** - Lower infrastructure costs
✅ **Faster deployment** - Less complexity
✅ **Easier debugging** - All logs in one place
✅ **Sufficient for most use cases** - Can handle significant traffic

You can always migrate to separate deployments later if you need better performance or global distribution.

---

*Ready to deploy? Choose your approach and run the deployment script!* 