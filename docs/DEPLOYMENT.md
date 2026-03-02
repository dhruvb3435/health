# Deployment Guide

## AWS Infrastructure Setup

### Prerequisites
- AWS Account with appropriate permissions
- AWS CLI configured
- Terraform installed (v1.5+)
- Docker installed
- GitHub repository with CI/CD workflows

### Architecture Diagram

```
┌────────────────────────────────────────────────────┐
│           CloudFront (CDN)                         │
│        (Frontend distribution)                     │
└─────────────────┬──────────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────────┐
│       Application Load Balancer (ALB)              │
│       (HTTPS, SSL/TLS termination)                 │
└─────────────────┬──────────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────────┐
│        AWS ECS Cluster (Fargate)                   │
│  ┌──────────────┐  ┌──────────────┐              │
│  │ NestJS Task  │  │ NestJS Task  │              │
│  │   (instance) │  │   (instance) │              │
│  │  - 2 vCPU    │  │  - 2 vCPU    │              │
│  │  - 4 GB RAM  │  │  - 4 GB RAM  │              │
│  └──────────────┘  └──────────────┘              │
└────────────────┬──────────────────────────────────┘
                 │
    ┌────────────┼────────────┬────────────┐
    │            │            │            │
┌───▼─┐    ┌────▼─┐    ┌────▼──┐    ┌───▼──┐
│ RDS │    │S3    │    │Redis  │    │ ECR  │
│ PDQ │    │(Files)   │(Cache)│    │(Reg) │
└─────┘    └──────┘    └───────┘    └──────┘
```

### Step 1: Set Up RDS (PostgreSQL)

```bash
# Create RDS instance via AWS console or CLI
aws rds create-db-instance \
  --db-instance-identifier healthcare-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 14.7 \
  --allocated-storage 100 \
  --storage-type gp3 \
  --master-username healthcare_admin \
  --master-user-password YOUR_SECURE_PASSWORD \
  --db-name healthcare_db \
  --backup-retention-period 30 \
  --multi-az \
  --enable-encryption \
  --storage-encrypted
```

### Step 2: Create S3 Bucket

```bash
# Create S3 bucket for medical documents
aws s3api create-bucket \
  --bucket healthcare-documents-prod \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket healthcare-documents-prod \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket healthcare-documents-prod \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket healthcare-documents-prod \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### Step 3: Set Up ElastiCache (Redis)

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id healthcare-cache \
  --engine redis \
  --engine-version 7.0 \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1 \
  --az us-east-1a \
  --auto-minor-version-upgrade \
  --engine-log-enabled true
```

### Step 4: Set Up ECR (Container Registry)

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name healthcare-backend \
  --region us-east-1 \
  --encryption-configuration encryptionType=KMS

# Enable image scanning
aws ecr put-image-scanning-configuration \
  --repository-name healthcare-backend \
  --image-scanning-configuration scanOnPush=true
```

### Step 5: Create ECS Cluster

```bash
# Create ECS cluster
aws ecs create-cluster \
  --cluster-name healthcare-prod \
  --settings name=containerInsights,value=enabled

# Create task execution role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
```

### Step 6: Set Up ALB

```bash
# Create security group
aws ec2 create-security-group \
  --group-name healthcare-alb-sg \
  --description "Security group for healthcare ALB"

# Allow HTTPS
aws ec2 authorize-security-group-ingress \
  --group-name healthcare-alb-sg \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Create ALB
aws elbv2 create-load-balancer \
  --name healthcare-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx \
  --scheme internet-facing \
  --type application
```

## Docker Configuration

### Backend Dockerfile
```dockerfile
# Dockerfile for NestJS Backend
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "dist/main.js"]
```

### Frontend Dockerfile
```dockerfile
# Dockerfile for Next.js Frontend
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=https://api.healthcare.com/api

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml (Local Development)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: healthcare_user
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: healthcare_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USER: healthcare_user
      DATABASE_PASSWORD: dev_password
      DATABASE_NAME: healthcare_db
      JWT_SECRET: dev-secret-key
      AWS_REGION: us-east-1
      REDIS_HOST: redis
      NODE_ENV: development
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
    command: npm run start:dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001/api
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy Healthcare System

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com
  ECR_REPOSITORY: healthcare-backend

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test:cov

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Docker image
        env:
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t ${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:$IMAGE_TAG ./backend
          docker push ${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:$IMAGE_TAG
          docker tag ${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:$IMAGE_TAG ${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:latest
          docker push ${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster healthcare-prod \
            --service healthcare-api-service \
            --force-new-deployment

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster healthcare-prod \
            --services healthcare-api-service
```

## Monitoring & Logging

### CloudWatch Configuration
```bash
# Create log groups
aws logs create-log-group --log-group-name /aws/ecs/healthcare-api
aws logs create-log-group --log-group-name /aws/ecs/healthcare-web

# Set retention
aws logs put-retention-policy \
  --log-group-name /aws/ecs/healthcare-api \
  --retention-in-days 30

# Create alarms
aws cloudwatch put-metric-alarm \
  --alarm-name high-cpu-usage \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:xxx:alerts
```

### DataDog Integration (Optional)
```yaml
# See docs/DEPLOYMENT.md for complete setup
```

## Environment Variables

### Backend Production
```bash
# .env.production
DATABASE_HOST=healthcare-db.xxx.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_USER=healthcare_admin
DATABASE_PASSWORD=${SECURE_PASSWORD}
DATABASE_NAME=healthcare_db

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRATION=24h

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
AWS_S3_BUCKET=healthcare-documents-prod

REDIS_HOST=healthcare-cache.xxx.cache.amazonaws.com
REDIS_PORT=6379

BACKEND_PORT=3001
BACKEND_URL=https://api.healthcare.com

NODE_ENV=production
LOG_LEVEL=info
```

## Health Checks & Monitoring

```typescript
// src/common/health.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date(),
      uptime: process.uptime(),
    };
  }
}
```

## Scaling & Auto-Scaling

### ECS Auto Scaling
```bash
# Create auto-scaling target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/healthcare-prod/healthcare-api-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy (target CPU 70%)
aws application-autoscaling put-scaling-policy \
  --policy-name cpu-scaling \
  --service-namespace ecs \
  --resource-id service/healthcare-prod/healthcare-api-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

## Disaster Recovery

### RDS Backup Strategy
```bash
# Automated daily backups with 30-day retention
# Multi-AZ deployment for high availability
# Cross-region read replicas for disaster recovery

# Restore from backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier healthcare-db-restored \
  --db-snapshot-identifier healthcare-db-snapshot-xxx
```

### Blue-Green Deployment
```bash
# Traffic shifts gradually from blue to green environment
# Automatic rollback on failure
# Zero-downtime deployments
```

---

**Last Updated**: February 2026
**Deployment Status**: Production-Ready
