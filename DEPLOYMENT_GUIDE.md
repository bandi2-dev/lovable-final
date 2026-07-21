# Resume AI Deployment Guide

## Containerization & Deployment

This guide provides step-by-step instructions for deploying the Resume AI application using Docker and Kubernetes.

## Prerequisites

- Docker and Docker Compose installed
- Kubernetes cluster (for production)
- kubectl configured
- Supabase account and project

## Environment Setup

### 1. Configure Environment Variables

Create `.env` files for each environment:

```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-public-key
VITE_MISTRAL_API_KEY=your-mistral-key

# .env.prod
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-public-key
VITE_MISTRAL_API_KEY=your-mistral-key
```

## Docker Deployment

### 1. Build Docker Images

```bash
# Build for local development
docker compose build app-local

# Build for production
docker compose build app-prod
```

### 2. Run Locally with Docker Compose

```bash
# Start local environment
docker compose up app-local

# Start with Supabase emulator (for local testing)
docker compose up app-local supabase
```

### 3. Test the Application

- Local: http://localhost:8080
- Dev: http://localhost:8081
- Test: http://localhost:8082
- Prod: http://localhost:8083

## Kubernetes Deployment

### 1. Update Kubernetes Manifests

Edit the ConfigMap with your actual Supabase URL and key:

```bash
# Edit k8s/base/configmap.yaml
VITE_SUPABASE_URL: "https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY: "your-public-key"
```

### 2. Create Kubernetes Secrets

```bash
kubectl create secret generic resume-analyzer-secrets \
  --from-literal=VITE_MISTRAL_API_KEY=your-mistral-key \
  --from-literal=VITE_SUPABASE_SERVICE_KEY=your-service-key
```

### 3. Deploy to Kubernetes

```bash
# Apply base manifests
kubectl apply -k k8s/base

# Apply production overlay
kubectl apply -k k8s/overlays/prod
```

### 4. Verify Deployment

```bash
# Check pods
kubectl get pods

# Check services
kubectl get svc

# Check ingress
kubectl get ingress

# View logs
kubectl logs -f deployment/resume-analyzer
```

## CI/CD Pipeline (Jenkins)

### Sample Jenkinsfile

```groovy
pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "your-registry"
        KUBE_CONFIG = credentials('kubeconfig')
        APP_VERSION = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Build') {
            steps {
                script {
                    docker.build("resume-analyzer:${APP_VERSION}")
                    docker.push("resume-analyzer:${APP_VERSION}")
                }
            }
        }

        stage('Test') {
            steps {
                script {
                    sh 'npm test'
                    sh 'docker scan resume-analyzer:${APP_VERSION}'
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    # Update image tag in Kubernetes manifests
                    sh "sed -i 's|resume-analyzer:.*|resume-analyzer:${APP_VERSION}|' k8s/overlays/prod/deployment-patch.yaml"

                    # Apply Kubernetes manifests
                    sh 'kubectl apply -k k8s/overlays/prod'

                    # Verify deployment
                    sh 'kubectl rollout status deployment/resume-analyzer -n your-namespace'
                }
            }
        }
    }
}
```

## Troubleshooting

### Common Issues

1. **Supabase Connection Issues**:
   - Verify environment variables are set correctly
   - Check network connectivity to Supabase
   - Verify CORS settings in Supabase

2. **Docker Build Failures**:
   - Ensure all required build arguments are provided
   - Check for missing environment variables
   - Verify Dockerfile syntax

3. **Kubernetes Deployment Issues**:
   - Check pod logs: `kubectl logs -f pod-name`
   - Verify resource limits are sufficient
   - Check ingress configuration

## Best Practices

1. **Environment Management**:
   - Use different environments for development, testing, and production
   - Never commit real secrets to version control

2. **Security**:
   - Use Kubernetes secrets for sensitive data
   - Implement proper RBAC in Kubernetes
   - Use network policies to restrict pod communication

3. **Monitoring**:
   - Set up health checks and monitoring
   - Configure proper logging
   - Implement alerting for critical issues

4. **Scaling**:
   - Use Horizontal Pod Autoscaler for automatic scaling
   - Monitor resource usage
   - Adjust limits based on actual usage patterns

## Production Checklist

- [ ] Configure proper domain name in ingress
- [ ] Set up TLS certificates (cert-manager)
- [ ] Configure proper resource limits
- [ ] Set up monitoring and alerting
- [ ] Implement backup strategy
- [ ] Configure proper logging
- [ ] Set up CI/CD pipeline
- [ ] Test failover and recovery procedures